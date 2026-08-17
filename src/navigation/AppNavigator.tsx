// src/navigation/AppNavigator.tsx — Root navigator with strict TypeScript types
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import CustomerTab from './CustomerTab';
import ProviderTab from './ProviderTab';
import CustomerNegotiationScreen from '../screens/customer/CustomerNegotiationScreen';
import ProviderNegotiationScreen from '../screens/provider/ProviderNegotiationScreen';
import ActiveBookingsScreen from '../screens/customer/ActiveBookingsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { userToken, userRole } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : userRole === 'customer' ? (
        <>
          <Stack.Screen name="CustomerTabNavigator" component={CustomerTab} />
          <Stack.Screen name="CustomerNegotiationScreen" component={CustomerNegotiationScreen} />
          <Stack.Screen name="ActiveBookingsScreen" component={ActiveBookingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="ProviderTabNavigator" component={ProviderTab} />
          <Stack.Screen name="ProviderNegotiationScreen" component={ProviderNegotiationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
