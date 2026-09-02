import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { typedApi } from './api';

export interface PreparedImage { uri: string; size: number; contentType: 'image/jpeg'; extension: 'jpg' }
type UploadIntent = { object_key: string; upload: { url: string; fields: Record<string, string> } };

export async function pickTaskImages(remaining: number): Promise<PreparedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo permission is required to attach task images.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.min(remaining, 5), quality: 0.85, exif: false });
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, remaining).map(async (asset) => {
    // Re-encoding deliberately removes EXIF metadata, including GPS coordinates.
    const rendered = await ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
    const size = (await fetch(rendered.uri).then((response) => response.blob())).size;
    return { uri: rendered.uri, size, contentType: 'image/jpeg' as const, extension: 'jpg' as const };
  }));
}

export async function uploadImage(image: PreparedImage, purpose: 'task' | 'kyc' | 'message'): Promise<string> {
  const { data, error } = await typedApi.POST('/api/v2/uploads/intents', { body: { purpose, content_type: image.contentType, size_bytes: image.size, file_extension: image.extension } });
  if (error || !data) throw new Error('Could not prepare the secure upload.');
  const intent = data as UploadIntent;
  const form = new FormData();
  Object.entries(intent.upload.fields).forEach(([key, value]) => form.append(key, value));
  if (Platform.OS === 'web') form.append('file', await fetch(image.uri).then((response) => response.blob()));
  else form.append('file', { uri: image.uri, name: 'image.jpg', type: image.contentType } as unknown as Blob);
  const response = await fetch(intent.upload.url, { method: 'POST', body: form });
  if (!response.ok) throw new Error('Image upload failed. No task was posted; please retry.');
  return intent.object_key;
}
