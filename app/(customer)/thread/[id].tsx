import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { LockKeyhole, SendHorizontal } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import EmptyState from '../../../src/components/EmptyState';
import TactilePressable from '../../../src/components/TactilePressable';
import { StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { ThreadSubscription } from '../../../src/services/websocket';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';
type Message = components['schemas']['MessageResponse'] & { pending?: boolean };

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const cache = useQueryClient();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['messages', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } } }); if (error) throw error; return data; } });
  useEffect(() => { const subscription = new ThreadSubscription(id, () => void cache.invalidateQueries({ queryKey: ['messages', id] }), () => undefined); void subscription.connect().catch(() => undefined); return () => subscription.close(); }, [cache, id]);
  useEffect(() => {
    const unread = (query.data ?? []).filter((message) => message.sender_user_id !== user?.id && !message.read_at).map((message) => message.id);
    if (!unread.length) return;
    void typedApi.POST('/api/v2/threads/{thread_id}/receipts', { params: { path: { thread_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { message_ids: unread, receipt: 'read' } }).then(() => cache.invalidateQueries({ queryKey: ['messages', id] }));
  }, [cache, id, query.data, user?.id]);
  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setSendError(null);
    setBody('');
    const clientId = Crypto.randomUUID();
    const optimistic: Message = { id: clientId, client_message_id: clientId, thread_id: id, sender_user_id: user?.id ?? '', body: text, attachment_key: null, reply_to_message_id: replyTo?.id ?? null, delivered_at: null, read_at: null, created_at: new Date().toISOString(), pending: true };
    setPending((items) => [...items, optimistic]);
    const selectedReply = replyTo;
    setReplyTo(null);
    const { error } = await typedApi.POST('/api/v2/threads/{thread_id}/messages', { params: { path: { thread_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { client_message_id: clientId, body: text, reply_to_message_id: selectedReply?.id ?? null } });
    setPending((items) => items.filter((item) => item.client_message_id !== clientId));
    if (error) { setBody(text); setReplyTo(selectedReply); setSendError(i18n.t('experience.chat.sendFailed')); } else await cache.invalidateQueries({ queryKey: ['messages', id] });
    setSending(false);
  };
  if (query.isLoading) return <StateView title={i18n.t('experience.chat.loading')} loading />;
  if (query.isError) return <StateView title={i18n.t('experience.chat.unavailable')} onRetry={() => query.refetch()} />;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.notice}><LockKeyhole color={Theme.colors.primary} size={14} /><Text style={styles.noticeText}>{i18n.t('experience.chat.private')}</Text></View>
      <FlatList data={[...(query.data ?? []), ...pending]} keyExtractor={(item: Message) => item.id} contentContainerStyle={[styles.list, !(query.data ?? []).length && !pending.length && styles.emptyList]} ListEmptyComponent={<EmptyState title={i18n.t('experience.chat.start')} detail={i18n.t('experience.chat.startDetail')} />} renderItem={({ item }: { item: Message }) => {
        const mine = item.sender_user_id === user?.id;
        const replied = item.reply_to_message_id ? [...(query.data ?? []), ...pending].find((candidate) => candidate.id === item.reply_to_message_id) : null;
        return <View style={[styles.messageRow, mine && styles.messageRowMine]}><TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.chat.replyA11y', { message: item.body })} onPress={() => !item.pending && setReplyTo(item)} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>{replied && <View style={styles.replyPreview}><Text numberOfLines={1} style={styles.replyText}>{replied.body}</Text></View>}<Text style={styles.message}>{item.body}</Text><Text style={styles.time}>{item.pending ? i18n.t('experience.chat.sending') : mine && item.read_at ? i18n.t('experience.chat.read') : mine && item.delivered_at ? i18n.t('experience.chat.delivered') : new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></TactilePressable></View>;
      }} />
      {!!sendError && <View accessibilityRole="alert" style={styles.sendError}><Text style={styles.sendErrorText}>{sendError}</Text></View>}
      {replyTo && <View style={styles.replyBar}><View style={{ flex: 1 }}><Text style={styles.replyLabel}>{i18n.t('experience.chat.replying')}</Text><Text numberOfLines={1} style={styles.replyBody}>{replyTo.body}</Text></View><TactilePressable accessibilityRole="button" onPress={() => setReplyTo(null)} style={styles.cancelReply}><Text style={styles.cancelReplyText}>{i18n.t('experience.chat.cancel')}</Text></TactilePressable></View>}
      <View style={styles.composer}>
        <TextInput accessibilityLabel={i18n.t('experience.chat.message')} value={body} onChangeText={setBody} multiline maxLength={2000} placeholder={i18n.t('experience.chat.placeholder')} placeholderTextColor={Theme.colors.textTertiary} style={styles.input} />
        <TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.chat.send')} disabled={!body.trim() || sending} style={[styles.send, (!body.trim() || sending) && styles.sendDisabled]} onPress={() => void send()}><SendHorizontal color={Theme.colors.white} size={20} /></TactilePressable>
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
  replyPreview: { borderLeftWidth: 3, borderLeftColor: Theme.colors.primaryLight, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: Theme.radius.xs, paddingHorizontal: Theme.spacing.sm, paddingVertical: 5, marginBottom: Theme.spacing.xs },
  replyText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  sendError: { backgroundColor: Theme.colors.errorLight, borderTopWidth: 1, borderTopColor: Theme.colors.error, paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm },
  sendErrorText: { ...Theme.typography.caption, color: Theme.colors.textPrimary, textAlign: 'center' },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm, backgroundColor: Theme.colors.primaryMist, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  replyLabel: { ...Theme.typography.metadata, color: Theme.colors.primary },
  replyBody: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 2 },
  cancelReply: { minWidth: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelReplyText: { ...Theme.typography.caption, color: Theme.colors.primary, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.sm, paddingBottom: Platform.OS === 'ios' ? Theme.spacing.xl : Theme.spacing.md, backgroundColor: Theme.colors.surfaceGlassStrong, borderTopWidth: 1, borderTopColor: Theme.colors.borderLight },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.lg, backgroundColor: Theme.colors.surface, paddingHorizontal: Theme.spacing.lg, paddingVertical: 12, ...Theme.typography.body, color: Theme.colors.textPrimary },
  send: { width: 48, height: 48, borderRadius: 17, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.42 },
});
