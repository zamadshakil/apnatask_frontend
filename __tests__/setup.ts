import { Alert } from 'react-native';
import { server } from './mocks/server';
import { MockWebSocket } from './mocks/websocket-mock';

// 1. Mock Alert.alert to automatically trigger button onPress callbacks
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length) {
    const okButton = buttons.find((b: any) => b.text === 'OK' || b.text === 'Dismiss') || buttons[0];
    if (okButton && okButton.onPress) {
      okButton.onPress();
    }
  }
});

// 2. Start MSW REST interception and force WebSocket mock
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
  global.WebSocket = MockWebSocket as any;
});

beforeEach(() => {
  global.WebSocket = MockWebSocket as any;
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// 3. Common React Native + Navigation Mocks
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Mock react-native-reanimated or expo-modules if used

// Mock react-native Animated to run synchronously in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = (value: any, config: any) => ({
    start: (callback: any) => {
      value.setValue(config.toValue);
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  });
  RN.Animated.spring = (value: any, config: any) => ({
    start: (callback: any) => {
      value.setValue(config.toValue);
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  });
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
