// src/screens/auth/LoginScreen.tsx — Premium onboarding login
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useAuth } from '../../navigation/AuthContext';
import { generateMockJWT } from '../../utils/jwt';
import { Theme } from '../../styles/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [userIdInput, setUserIdInput] = useState('1');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(null);

  const handleLogin = () => {
    if (!selectedRole) return;
    const userId = parseInt(userIdInput, 10) || (selectedRole === 'customer' ? 1 : 2);
    const token = generateMockJWT(userId, selectedRole);
    login(selectedRole, userId, token);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Top Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
          </View>
          <Text style={styles.appName}>ApnaTask</Text>
          <Text style={styles.tagline}>Pakistan's Hyperlocal Services Marketplace</Text>
        </View>

        {/* Bottom Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>Select your role to continue</Text>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'customer' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('customer')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIcon, selectedRole === 'customer' && styles.roleIconActive]}>
                  <Text style={styles.roleEmoji}>📋</Text>
                </View>
                <Text style={[styles.roleTitle, selectedRole === 'customer' && styles.roleTitleActive]}>
                  Customer
                </Text>
                <Text style={styles.roleDesc}>Post tasks & hire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'provider' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('provider')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIcon, selectedRole === 'provider' && styles.roleIconActive]}>
                  <Text style={styles.roleEmoji}>🔧</Text>
                </View>
                <Text style={[styles.roleTitle, selectedRole === 'provider' && styles.roleTitleActive]}>
                  Provider
                </Text>
                <Text style={styles.roleDesc}>Find jobs & earn</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="User ID (Dev Mode)"
              value={userIdInput}
              onChangeText={setUserIdInput}
              keyboardType="numeric"
              hint="Mock authentication — enter any ID"
            />

            <Button
              title={selectedRole ? `Continue as ${selectedRole === 'customer' ? 'Customer' : 'Provider'}` : 'Select a role'}
              onPress={handleLogin}
              disabled={!selectedRole}
              size="lg"
            />

            <Text style={styles.devNote}>
              🔒 Development Mode — Mock JWT Authentication
            </Text>
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
  flex: {
    flex: 1,
  },
  brandSection: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xxl,
  },
  logoContainer: {
    marginBottom: Theme.spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: Theme.colors.textOnPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formSection: {
    flex: 0.65,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
  },
  formCard: {
    flex: 1,
  },
  welcomeText: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  instructionText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  roleCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F0FFF4',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  roleIconActive: {
    backgroundColor: '#E8F5E9',
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  roleTitleActive: {
    color: Theme.colors.primary,
  },
  roleDesc: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
  },
  devNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Theme.colors.textTertiary,
    marginTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
});
