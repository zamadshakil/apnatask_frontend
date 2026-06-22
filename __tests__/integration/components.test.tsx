import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import ChatBubble from '../../src/components/ChatBubble';
import Input from '../../src/components/Input';
import Badge from '../../src/components/Badge';
import BidCard from '../../src/components/BidCard';
import { Text } from 'react-native';

describe('UI Components Unit Tests', () => {
  describe('Button', () => {
    it('renders correctly and responds to press', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Test Button" onPress={onPressMock} testID="test-btn" />
      );
      const btn = getByText('Test Button');
      expect(btn).toBeTruthy();
      fireEvent.press(btn);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner when loading', () => {
      const { queryByText } = render(
        <Button title="Loading" onPress={jest.fn()} loading />
      );
      // Text should not be visible when loading
      expect(queryByText('Loading')).toBeNull();
    });

    it('does not fire onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" onPress={onPressMock} disabled />
      );
      fireEvent.press(getByText('Disabled'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders with children', () => {
      const { getByText } = render(
        <Card testID="test-card">
          <Text>Card Content</Text>
        </Card>
      );
      expect(getByText('Card Content')).toBeTruthy();
    });

    it('is pressable when onPress is provided', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Card onPress={onPressMock}>
          <Text>Pressable Card</Text>
        </Card>
      );
      fireEvent.press(getByText('Pressable Card'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ChatBubble', () => {
    it('renders message text', () => {
      const { getByText } = render(
        <ChatBubble message="Hello Customer" senderRole="provider" currentRole="customer" />
      );
      expect(getByText('Hello Customer')).toBeTruthy();
    });

    it('renders sender name for received messages', () => {
      const { getByText } = render(
        <ChatBubble message="Hi" senderName="Ali Plumber" senderRole="provider" currentRole="customer" />
      );
      expect(getByText('Ali Plumber')).toBeTruthy();
    });

    it('renders timestamp when provided', () => {
      const { getByText } = render(
        <ChatBubble message="Timed" isSent timestamp="2:30 PM" />
      );
      expect(getByText('2:30 PM')).toBeTruthy();
    });
  });

  describe('Input', () => {
    it('renders label and handles text changes', () => {
      const onChangeTextMock = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <Input label="Email" value="" onChangeText={onChangeTextMock} placeholder="Type here" />
      );
      expect(getByText('Email')).toBeTruthy();
      const input = getByPlaceholderText('Type here');
      fireEvent.changeText(input, 'New Text');
      expect(onChangeTextMock).toHaveBeenCalledWith('New Text');
    });

    it('shows error text when provided', () => {
      const { getByText } = render(
        <Input label="Name" value="" onChangeText={jest.fn()} error="Required field" />
      );
      expect(getByText('Required field')).toBeTruthy();
    });

    it('shows hint text when provided', () => {
      const { getByText } = render(
        <Input label="Budget" value="" onChangeText={jest.fn()} hint="Enter amount in PKR" />
      );
      expect(getByText('Enter amount in PKR')).toBeTruthy();
    });
  });

  describe('Badge', () => {
    it('renders label with correct variant', () => {
      const { getByText } = render(
        <Badge label="Verified" variant="verified" />
      );
      expect(getByText('Verified')).toBeTruthy();
    });

    it('renders the checkmark icon for verified variant', () => {
      const { getByText } = render(
        <Badge label="KYC" variant="verified" />
      );
      expect(getByText('✓')).toBeTruthy();
    });
  });

  describe('BidCard', () => {
    it('renders provider name and amount', () => {
      const { getByText } = render(
        <BidCard providerName="Ali Plumber" amount={1500} />
      );
      expect(getByText('Ali Plumber')).toBeTruthy();
      expect(getByText(/1,500/)).toBeTruthy();
    });

    it('shows accept button for received bids', () => {
      const onAccept = jest.fn();
      const { getByText } = render(
        <BidCard providerName="Ali" amount={2000} onAccept={onAccept} />
      );
      const acceptBtn = getByText('Accept Bid');
      expect(acceptBtn).toBeTruthy();
      fireEvent.press(acceptBtn);
      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('hides action buttons for own bids', () => {
      const { queryByText } = render(
        <BidCard providerName="You" amount={1200} isOwnBid />
      );
      expect(queryByText('Accept Bid')).toBeNull();
      expect(queryByText('Counter')).toBeNull();
    });

    it('shows KYC badge when verified', () => {
      const { getByText } = render(
        <BidCard providerName="Ali" amount={1000} isVerified />
      );
      expect(getByText('KYC')).toBeTruthy();
    });
  });
});
