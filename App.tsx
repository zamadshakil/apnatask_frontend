import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from './src/navigation/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { supabase } from './src/services/supabaseClient';
import api from './src/services/api';

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'provider' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserToken(session.access_token);
        setUserId(session.user.id);
        setUserRole(session.user.user_metadata?.role || 'customer');
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserToken(session.access_token);
        setUserId(session.user.id);
        setUserRole(session.user.user_metadata?.role || 'customer');
      } else {
        setUserToken(null);
        setUserId(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Register push tokens dynamically on login
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

  const login = (role: 'customer' | 'provider', id: string, token: string) => {
    setUserToken(token);
    setUserRole(role);
    setUserId(id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserToken(null);
    setUserRole(null);
    setUserId(null);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ userToken, userRole, userId, login, logout }}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
