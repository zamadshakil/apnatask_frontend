// src/types/navigation.ts — Strict TypeScript Navigation Interfaces & Param Lists
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type CustomerTabParamList = {
  CustomerHome: undefined;
  CreateTask: { initialCategory?: string | null } | undefined;
  ActiveBookings: undefined;
};

export type ProviderTabParamList = {
  ProviderHome: undefined;
  FindJobs: undefined;
  ProviderWallet: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  CustomerTabNavigator: NavigatorScreenParams<CustomerTabParamList> | undefined;
  ProviderTabNavigator: NavigatorScreenParams<ProviderTabParamList> | undefined;
  CustomerNegotiationScreen: { bookingId?: number } | undefined;
  ProviderNegotiationScreen: { bookingId?: number; token?: string } | undefined;
  ActiveBookingsScreen: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type CustomerTabScreenProps<T extends keyof CustomerTabParamList> =
  BottomTabScreenProps<CustomerTabParamList, T>;

export type ProviderTabScreenProps<T extends keyof ProviderTabParamList> =
  BottomTabScreenProps<ProviderTabParamList, T>;
