// src/screens/customer/CustomerNegotiationScreen.tsx — WhatsApp-style negotiation
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import { Theme } from '../../styles/theme';
import { NegotiationWebSocket } from '../../services/websocket';
import ChatBubble from '../../components/ChatBubble';
import BidCard from '../../components/BidCard';
import Badge from '../../components/Badge';

interface Message {
  id: string;
  type: 'chat' | 'bid' | 'accept';
  sender_id: number;
  role: 'customer' | 'provider';
  message?: string;
  amount?: number;
  timestamp: string;
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CustomerNegotiationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userId, userToken } = useAuth();
  const bookingId = route.params?.bookingId || 101;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showBidInput, setShowBidInput] = useState(false);
  const wsRef = useRef<NegotiationWebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!userToken) return;

    const ws = new NegotiationWebSocket(
      bookingId,
      userToken,
      (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            type: data.type,
            sender_id: data.sender_id,
            role: data.role,
            message: data.message,
            amount: data.amount,
            timestamp: formatTime(),
          },
        ]);
      },
      () => setIsConnected(false),
      () => setIsConnected(false),
    );

    ws.connect();
    wsRef.current = ws;
    setIsConnected(true);

    return () => ws.close();
  }, [bookingId, userToken]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !wsRef.current || !userId) return;

    const msg = {
      type: 'chat' as const,
      booking_id: bookingId,
      sender_id: userId,
      role: 'customer' as const,
      message: inputText,
    };
    wsRef.current.send(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), amount: undefined, timestamp: formatTime() },
    ]);
    setInputText('');
  };

  const handleSendBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || !wsRef.current || !userId) return;

    const msg = {
      type: 'bid' as const,
      booking_id: bookingId,
      sender_id: userId,
      role: 'customer' as const,
      amount,
    };
    wsRef.current.send(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), message: undefined, timestamp: formatTime() },
    ]);
    setBidAmount('');
    setShowBidInput(false);
  };

  const handleAcceptBid = (senderId: number, amount: number) => {
    if (!wsRef.current || !userId) return;

    const msg = {
      type: 'accept' as const,
      booking_id: bookingId,
      sender_id: userId,
      role: 'customer' as const,
      amount,
    };
    wsRef.current.send(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), message: undefined, timestamp: formatTime() },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === userId && item.role === 'customer';

    if (item.type === 'accept') {
      return (
        <View style={styles.systemMessage}>
          <View style={styles.systemBubble}>
            <Text style={styles.systemEmoji}>🤝</Text>
            <Text style={styles.systemText}>
              Bid of Rs. {item.amount?.toLocaleString()} accepted!
            </Text>
            <Text style={styles.systemSubtext}>
              Escrow payment is being processed
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === 'bid') {
      return (
        <View style={styles.bidWrapper}>
          <BidCard
            providerName={isMe ? 'You' : `Provider #${item.sender_id}`}
            amount={item.amount || 0}
            isOwnBid={isMe}
            timestamp={item.timestamp}
            isVerified={!isMe}
            onAccept={!isMe ? () => handleAcceptBid(item.sender_id, item.amount || 0) : undefined}
          />
        </View>
      );
    }

    return (
      <ChatBubble
        isSent={isMe}
        message={item.message}
        timestamp={item.timestamp}
        senderName={!isMe ? `Provider #${item.sender_id}` : undefined}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking #{bookingId}</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.connectionDot, isConnected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chatBackground}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>
                  Waiting for provider bids...
                </Text>
                <Text style={styles.emptyChatSubtext}>
                  Providers will send their bids here. You can negotiate and accept.
                </Text>
              </View>
            }
          />
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          {showBidInput && (
            <View style={styles.bidInputRow}>
              <TextInput
                style={styles.bidInput}
                placeholder="Counter-offer (PKR)"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholderTextColor={Theme.colors.textTertiary}
              />
              <TouchableOpacity style={styles.bidSendBtn} onPress={handleSendBid}>
                <Text style={styles.bidSendText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bidCancelBtn} onPress={() => setShowBidInput(false)}>
                <Text style={styles.bidCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.chatInputRow}>
            <TouchableOpacity
              style={styles.bidToggleBtn}
              onPress={() => setShowBidInput(!showBidInput)}
              activeOpacity={0.7}
            >
              <Text style={styles.bidToggleText}>₨</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={Theme.colors.textTertiary}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: Theme.colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textOnPrimary,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: Theme.colors.accent,
  },
  dotOffline: {
    backgroundColor: Theme.colors.error,
  },
  connectionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  chatArea: {
    flex: 1,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: Theme.colors.chatBackground,
  },
  messageList: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    flexGrow: 1,
  },
  bidWrapper: {
    paddingHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
  },
  systemBubble: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#80CBC4',
  },
  systemEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  systemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004D40',
  },
  systemSubtext: {
    fontSize: 12,
    color: '#00695C',
    marginTop: 2,
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Theme.spacing.xxl,
  },
  emptyChatIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.md,
  },
  emptyChatText: {
    ...Theme.typography.h3,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    lineHeight: 20,
  },
  actionPanel: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.warningLight,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  bidInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  bidSendBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
  },
  bidSendText: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  bidCancelBtn: {
    padding: 6,
  },
  bidCancelText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  bidToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidToggleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.white,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 10,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
  sendBtnText: {
    fontSize: 18,
    color: Theme.colors.white,
  },
});
