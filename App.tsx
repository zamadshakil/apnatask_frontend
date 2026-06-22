import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from './src/navigation/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { generateMockJWT } from './src/utils/jwt';
import api from './src/services/api';

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'provider' | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (userToken && userId && userRole) {
      const pushToken = `ExponentPushToken[mock_token_${userRole}_${userId}]`;
      api.post('/push-token', {
        user_id: userId,
        role: userRole,
        push_token: pushToken
      }).then(() => {
        console.log(`Successfully registered push token for ${userRole} ${userId}`);
      }).catch(err => {
        console.error('Failed to register push token:', err);
      });
    }
  }, [userToken, userId, userRole]);

  const login = (role: 'customer' | 'provider', id?: number, token?: string) => {
    const resolvedId = id || (role === 'customer' ? 10 : 101);
    const resolvedToken = token || generateMockJWT(resolvedId, role);
    setUserToken(resolvedToken);
    setUserRole(role);
    setUserId(resolvedId);
  };

  const logout = () => {
    setUserToken(null);
    setUserRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, userId, login, logout }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
