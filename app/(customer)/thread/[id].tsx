import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../src/components/Button';
import { StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { ThreadSubscription } from '../../../src/services/websocket';
import { Theme } from '../../../src/styles/theme';
type Message = components['schemas']['MessageResponse'];

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { user } = useSession(); const cache = useQueryClient(); const [body, setBody] = useState(''); const [sending, setSending] = useState(false);
  const query = useQuery({ queryKey: ['messages', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } } }); if (error) throw error; return data; } });
  useEffect(() => { const subscription = new ThreadSubscription(id, () => void cache.invalidateQueries({ queryKey: ['messages', id] }), () => undefined); void subscription.connect().catch(() => undefined); return () => subscription.close(); }, [cache, id]);
  const send = async () => { const text = body.trim(); if (!text) return; setSending(true); setBody(''); const clientId = Crypto.randomUUID(); const { error } = await typedApi.POST('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { client_message_id: clientId, body: text } }); if (error) { setBody(text); Alert.alert('Message not sent', 'Check your connection and retry.'); } else await cache.invalidateQueries({ queryKey: ['messages', id] }); setSending(false); };
  if (query.isLoading) return <StateView title="Loading conversation…" loading />; if (query.isError) return <StateView title="Conversation unavailable" onRetry={() => query.refetch()} />;
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}><FlatList data={query.data ?? []} keyExtractor={(item: Message) => item.id} contentContainerStyle={styles.list} renderItem={({ item }: { item: Message }) => <View style={[styles.bubble, item.sender_user_id === user?.id ? styles.mine : styles.theirs]}><Text>{item.body}</Text><Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>} /><View style={styles.composer}><TextInput accessibilityLabel="Message" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="Write a message" style={styles.input} /><Button title="Send" loading={sending} disabled={!body.trim()} onPress={() => void send()} /></View></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: Theme.colors.chatBackground }, list: { padding: 16, gap: 8 }, bubble: { maxWidth: '82%', padding: 12, borderRadius: 14 }, mine: { alignSelf: 'flex-end', backgroundColor: Theme.colors.chatBubbleSent }, theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' }, time: { fontSize: 10, color: Theme.colors.textSecondary, marginTop: 4, alignSelf: 'flex-end' }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: '#fff' }, input: { flex: 1, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120 } });
