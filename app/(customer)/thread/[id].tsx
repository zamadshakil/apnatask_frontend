import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { LockKeyhole, SendHorizontal } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import EmptyState from '../../../src/components/EmptyState';
import TactilePressable from '../../../src/components/TactilePressable';
import { StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { ThreadSubscription } from '../../../src/services/websocket';
import { Theme } from '../../../src/styles/theme';
type Message = components['schemas']['MessageResponse'];

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const cache = useQueryClient();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const query = useQuery({ queryKey: ['messages', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } } }); if (error) throw error; return data; } });
  useEffect(() => { const subscription = new ThreadSubscription(id, () => void cache.invalidateQueries({ queryKey: ['messages', id] }), () => undefined); void subscription.connect().catch(() => undefined); return () => subscription.close(); }, [cache, id]);
  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setBody('');
    const clientId = Crypto.randomUUID();
    const { error } = await typedApi.POST('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { client_message_id: clientId, body: text } });
    if (error) { setBody(text); Alert.alert('Message not sent', 'Check your connection and retry.'); } else await cache.invalidateQueries({ queryKey: ['messages', id] });
    setSending(false);
  };
  if (query.isLoading) return <StateView title="Loading conversation…" loading />;
  if (query.isError) return <StateView title="Conversation unavailable" onRetry={() => query.refetch()} />;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.notice}><LockKeyhole color={Theme.colors.primary} size={14} /><Text style={styles.noticeText}>Private conversation · never share an OTP or payment PIN</Text></View>
      <FlatList data={query.data ?? []} keyExtractor={(item: Message) => item.id} contentContainerStyle={[styles.list, !(query.data ?? []).length && styles.emptyList]} ListEmptyComponent={<EmptyState title="Start the conversation" detail="Ask a question, clarify the work, or agree on what the offer includes." />} renderItem={({ item }: { item: Message }) => {
        const mine = item.sender_user_id === user?.id;
        return <View style={[styles.messageRow, mine && styles.messageRowMine]}><View style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={styles.message}>{item.body}</Text><Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View></View>;
      }} />
      <View style={styles.composer}>
        <TextInput accessibilityLabel="Message" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="Write a message" placeholderTextColor={Theme.colors.textTertiary} style={styles.input} />
        <TactilePressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!body.trim() || sending} style={[styles.send, (!body.trim() || sending) && styles.sendDisabled]} onPress={() => void send()}><SendHorizontal color={Theme.colors.white} size={20} /></TactilePressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.chatBackground },
  notice: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Theme.spacing.xs, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg, backgroundColor: Theme.colors.primaryMist, borderBottomWidth: 1, borderBottomColor: Theme.colors.borderLight },
  noticeText: { ...Theme.typography.metadata, color: Theme.colors.textSecondary },
  list: { paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.xl, gap: Theme.spacing.sm, width: '100%', maxWidth: 760, alignSelf: 'center' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  messageRow: { flexDirection: 'row' },
  messageRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, paddingBottom: Theme.spacing.sm, borderRadius: Theme.radius.lg },
  mine: { backgroundColor: Theme.colors.chatBubbleSent, borderBottomRightRadius: Theme.radius.xs },
  theirs: { backgroundColor: Theme.colors.chatBubbleReceived, borderBottomLeftRadius: Theme.radius.xs, borderWidth: 1, borderColor: Theme.colors.borderLight },
  message: { ...Theme.typography.body, color: Theme.colors.textPrimary },
  time: { ...Theme.typography.metadata, fontSize: 9, color: Theme.colors.textTertiary, marginTop: Theme.spacing.xs, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.sm, paddingBottom: Platform.OS === 'ios' ? Theme.spacing.xl : Theme.spacing.md, backgroundColor: Theme.colors.surfaceGlassStrong, borderTopWidth: 1, borderTopColor: Theme.colors.borderLight },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.lg, backgroundColor: Theme.colors.surface, paddingHorizontal: Theme.spacing.lg, paddingVertical: 12, ...Theme.typography.body, color: Theme.colors.textPrimary },
  send: { width: 48, height: 48, borderRadius: 17, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.42 },
});
