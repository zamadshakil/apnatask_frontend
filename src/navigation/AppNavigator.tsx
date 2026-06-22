import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import CustomerTab from './CustomerTab';
import ProviderTab from './ProviderTab';
import CustomerNegotiationScreen from '../screens/customer/CustomerNegotiationScreen';
import ProviderNegotiationScreen from '../screens/provider/ProviderNegotiationScreen';
import ActiveBookingsScreen from '../screens/customer/ActiveBookingsScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { userToken, userRole } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : userRole === 'customer' ? (
        <>
          <Stack.Screen name="CustomerHome" component={CustomerTab} />
          <Stack.Screen name="CustomerNegotiationScreen" component={CustomerNegotiationScreen} />
          <Stack.Screen name="ActiveBookingsScreen" component={ActiveBookingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="ProviderHome" component={ProviderTab} />
          <Stack.Screen name="ProviderNegotiationScreen" component={ProviderNegotiationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
