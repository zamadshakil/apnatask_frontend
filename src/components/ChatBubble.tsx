// src/components/ChatBubble.tsx — WhatsApp-style chat bubble with timestamps
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Text } from 'react-native';
import { Theme } from '../styles/theme';

interface ChatBubbleProps {
  children?: ReactNode;
  isSent?: boolean;
  style?: ViewStyle;
  message?: string;
  senderRole?: 'customer' | 'provider';
  currentRole?: 'customer' | 'provider';
  senderName?: string;
  timestamp?: string;
}

export default function ChatBubble({
  children,
  isSent,
  style,
  message,
  senderRole,
  currentRole,
  senderName,
  timestamp,
}: ChatBubbleProps) {
  const sent = isSent !== undefined
    ? isSent
    : (senderRole && currentRole ? senderRole === currentRole : false);

  return (
    <View style={[styles.wrapper, sent ? styles.wrapperSent : styles.wrapperReceived]}>
      <View
        style={[
          styles.bubble,
          sent ? styles.sentBubble : styles.receivedBubble,
          style,
        ]}
      >
        {!sent && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        {children ? children : <Text style={styles.messageText}>{message}</Text>}
        {timestamp && (
          <View style={styles.timestampRow}>
            <Text style={styles.timestamp}>{timestamp}</Text>
            {sent && <Text style={styles.readReceipt}>✓✓</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 2,
    paddingHorizontal: Theme.spacing.md,
  },
  wrapperSent: {
    alignItems: 'flex-end',
  },
  wrapperReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    minWidth: 80,
  },
  sentBubble: {
    backgroundColor: Theme.colors.chatBubbleSent,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: Theme.radius.sm,
    borderBottomRightRadius: Theme.radius.sm,
    borderTopLeftRadius: Theme.radius.sm,
  },
  receivedBubble: {
    backgroundColor: Theme.colors.chatBubbleReceived,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: Theme.radius.sm,
    borderBottomRightRadius: Theme.radius.sm,
    borderTopRightRadius: Theme.radius.sm,
    ...Theme.shadows.sm,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primaryLight,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  timestamp: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
  },
  readReceipt: {
    fontSize: 11,
    color: Theme.colors.verified,
  },
});
