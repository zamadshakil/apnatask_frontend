// src/screens/provider/ProviderNegotiationScreen.tsx — Provider bidding & chat
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import ChatBubble from '../../components/ChatBubble';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { NegotiationWebSocket } from '../../services/websocket';
import api from '../../services/api';
import { Theme } from '../../styles/theme';

interface ChatMessage {
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

export const ProviderNegotiationScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userId } = useAuth();

  const { bookingId = 1, token = 'mock-jwt-provider-20' } = route.params || {};
  const providerId = userId || 102;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(150);
  const [walletError, setWalletError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [bidAccepted, setBidAccepted] = useState(false);

  const wsRef = useRef<NegotiationWebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const fetchWallet = async () => {
    try {
      const response = await api.get(`/provider/${providerId}/wallet`);
      setWalletBalance(response.data.balance);
    } catch (err) {
      // Use local state fallback
    }
  };

  useEffect(() => {
    fetchWallet();

    if (!token) return;

    const ws = new NegotiationWebSocket(
      bookingId,
      token,
      (data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        const msg: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          type: data.type,
          sender_id: data.sender_id,
          role: data.role,
          message: data.message,
          amount: data.amount,
          timestamp: formatTime(),
        };
        setMessages((prev) => [...prev, msg]);

        if (data.type === 'accept') {
          setBidAccepted(true);
          Alert.alert('🎉 Bid Accepted!', 'The customer has accepted your bid. Escrow is locked.');
        }
      },
      () => setIsConnected(false),
    );

    ws.connect();
    wsRef.current = ws;
    setIsConnected(true);

    return () => ws.close();
  }, [bookingId, token, providerId]);

  const handleSendChat = () => {
    if (!inputText.trim()) return;
    const msg = {
      type: 'chat' as const,
      booking_id: Number(bookingId),
      sender_id: providerId,
      role: 'provider' as const,
      message: inputText,
    };
    wsRef.current?.send(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), amount: undefined, timestamp: formatTime() },
    ]);
    setInputText('');
  };

  const handlePostBid = () => {
    if (!bidAmount) return;
    const amountVal = parseFloat(bidAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setWalletError('Enter a valid bid amount');
      return;
    }

    // Wallet guardrail
    if (walletBalance < 100) {
      setWalletError('Insufficient balance! Minimum Rs. 100 required to bid. Please top up your wallet.');
      return;
    }

    setWalletError('');
    const msg = {
      type: 'bid' as const,
      booking_id: Number(bookingId),
      sender_id: providerId,
      role: 'provider' as const,
      amount: amountVal,
      message: `Bid placed: ${amountVal} PKR`,
    };
    wsRef.current?.send(msg);
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString(), timestamp: formatTime() },
    ]);
    setBidAmount('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === providerId && item.role === 'provider';

    if (item.type === 'accept') {
      return (
        <View style={styles.systemMessage}>
          <View style={styles.systemBubble}>
            <Text style={styles.systemEmoji}>🤝</Text>
            <Text style={styles.systemText}>
              Bid of Rs. {item.amount?.toLocaleString()} accepted!
            </Text>
            <Text style={styles.systemSubtext}>Escrow locked — payment secured</Text>
          </View>
        </View>
      );
    }

    if (item.type === 'bid') {
      return (
        <View style={styles.bidWrapper}>
          <View style={[styles.bidBubble, isMe ? styles.bidSent : styles.bidReceived]}>
            <Text style={styles.bidLabel}>{isMe ? '📤 Your Bid' : '📥 Counter-offer'}</Text>
            <Text style={styles.bidAmount}>Rs. {item.amount?.toLocaleString()}</Text>
            <Text style={styles.bidTime}>{item.timestamp}</Text>
          </View>
        </View>
      );
    }

    return (
      <ChatBubble
        isSent={isMe}
        message={item.message}
        timestamp={item.timestamp}
        senderName={!isMe ? `Customer #${item.sender_id}` : undefined}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job #{bookingId}</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.connectionDot, isConnected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.connectionLabel}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.walletBadge}>
          <Text style={styles.walletBadgeText}>Rs. {walletBalance}</Text>
        </View>
      </View>

      {/* Bid Accepted Banner */}
      {bidAccepted && (
        <View style={styles.acceptedBanner}>
          <Text style={styles.acceptedText}>✅ Bid Accepted — Escrow Locked</Text>
        </View>
      )}

      {/* Wallet Error */}
      {walletError !== '' && (
        <View style={styles.walletErrorBanner}>
          <Text style={styles.walletErrorText}>⚠️ {walletError}</Text>
        </View>
      )}

      {/* Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
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
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>🔧</Text>
                <Text style={styles.emptyChatTitle}>Ready to Bid</Text>
                <Text style={styles.emptyChatText}>
                  Submit your bid below. The customer will see it in real-time and can accept or negotiate.
                </Text>
              </View>
            }
          />
        </View>

        {/* Input Panel */}
        <View style={styles.inputPanel}>
          {/* Bid Input Row */}
          <View style={styles.bidInputRow}>
            <TextInput
              value={bidAmount}
              onChangeText={setBidAmount}
              placeholder="Enter bid amount (PKR)"
              keyboardType="numeric"
              style={styles.bidInput}
              placeholderTextColor={Theme.colors.textTertiary}
              testID="input-bid-amount"
            />
            <TouchableOpacity
              style={[styles.bidSubmitBtn, !bidAmount && styles.bidSubmitDisabled]}
              onPress={handlePostBid}
              disabled={!bidAmount}
              activeOpacity={0.7}
              testID="button-submit-bid"
            >
              <Text style={styles.bidSubmitText}>Bid</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Input Row */}
          <View style={styles.chatInputRow}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type message..."
              style={styles.chatInput}
              placeholderTextColor={Theme.colors.textTertiary}
              onSubmitEditing={handleSendChat}
              testID="chat-message-input"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSendChat}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
              testID="button-send-chat"
            >
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.darkSlate,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.darkSlate,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: Theme.colors.textOnDark,
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
    color: Theme.colors.textOnDark,
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
  connectionLabel: {
    fontSize: 11,
    color: 'rgba(233,237,239,0.7)',
  },
  walletBadge: {
    backgroundColor: 'rgba(37,211,102,0.2)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  walletBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  acceptedBanner: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  walletErrorBanner: {
    backgroundColor: Theme.colors.errorLight,
    paddingVertical: 8,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
  },
  walletErrorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.error,
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
    alignItems: 'center',
    marginVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  bidBubble: {
    width: '85%',
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  bidSent: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.accent,
  },
  bidReceived: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.moneyGold,
  },
  bidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
  },
  bidTime: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    marginTop: 4,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
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
  emptyChat: {
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
  emptyChatTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  emptyChatText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputPanel: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  bidInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  bidSubmitBtn: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
  },
  bidSubmitDisabled: {
    opacity: 0.5,
  },
  bidSubmitText: {
    color: Theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 10,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
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

export default ProviderNegotiationScreen;
