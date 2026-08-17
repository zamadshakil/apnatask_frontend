// src/screens/customer/CustomerNegotiationScreen.tsx — WhatsApp-style negotiation
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Banknote, Info, Wifi, WifiOff } from 'lucide-react-native';
import { useAuth } from '../../navigation/AuthContext';
import { Theme } from '../../styles/theme';
import { NegotiationWebSocket } from '../../services/websocket';
import ChatBubble from '../../components/ChatBubble';
import BidCard from '../../components/BidCard';

interface Message {
  id: string;
  type: 'chat' | 'bid' | 'accept';
  sender_id: string;
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
            sender_id: String(data.sender_id),
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
      { ...msg, id: Date.now().toString(), sender_id: String(userId), amount: undefined, timestamp: formatTime() },
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
      { ...msg, id: Date.now().toString(), sender_id: String(userId), message: undefined, timestamp: formatTime() },
    ]);
    setBidAmount('');
    setShowBidInput(false);
  };

  const handleAcceptBid = (providerId: string, amount: number) => {
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
      { ...msg, id: Date.now().toString(), sender_id: String(userId), message: undefined, timestamp: formatTime() },
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
              Escrow payment is locked securely.
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === 'bid') {
      return (
        <View style={styles.bidWrapper}>
          <BidCard
            providerName={isMe ? 'You (Customer)' : `Provider #${item.sender_id.slice(0, 5)}`}
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
        senderName={!isMe ? `Provider #${item.sender_id.slice(0, 5)}` : undefined}
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
          <ArrowLeft size={22} color={Theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Booking #{bookingId}</Text>
          <View style={styles.connectionRow}>
            {isConnected ? (
              <Wifi size={12} color={Theme.colors.accent} />
            ) : (
              <WifiOff size={12} color={Theme.colors.error} />
            )}
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
                <Info size={40} color={Theme.colors.textTertiary} style={styles.emptyChatIcon} />
                <Text style={styles.emptyChatText}>
                  Waiting for provider bids...
                </Text>
                <Text style={styles.emptyChatSubtext}>
                  Interested local service providers will submit bids here. You can chat to negotiate and click "Accept Bid" once agreed.
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
                placeholder="Counter-offer amount (PKR)"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholderTextColor={Theme.colors.textTertiary}
              />
              <TouchableOpacity style={styles.bidSendBtn} onPress={handleSendBid}>
                <Text style={styles.bidSendText}>Offer</Text>
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
              <Banknote size={20} color={Theme.colors.white} />
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
              <Send size={18} color={Theme.colors.white} />
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
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textOnPrimary,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  connectionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#F5F6F8', // clean background instead of beige
  },
  messageList: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    flexGrow: 1,
  },
  bidWrapper: {
    paddingHorizontal: Theme.spacing.xs,
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
    paddingVertical: 100,
    paddingHorizontal: Theme.spacing.xxl,
  },
  emptyChatIcon: {
    marginBottom: Theme.spacing.md,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    lineHeight: 18,
  },
  actionPanel: {
    backgroundColor: Theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.warningLight,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.warning,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
});
