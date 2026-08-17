// src/screens/auth/LoginScreen.tsx — Premium Supabase Auth & Onboarding
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Phone, Briefcase, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../navigation/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Theme } from '../../styles/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('plumber'); // Default for provider
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!selectedRole) {
          Alert.alert('Required', 'Please select whether you are a Customer or a Provider.');
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          Alert.alert('Required', 'Please enter your full name.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              name: name.trim(),
              role: selectedRole,
              phone: phone.trim() || undefined,
              category: selectedRole === 'provider' ? category : undefined,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          login(selectedRole, data.session.user.id, data.session.access_token);
        } else {
          Alert.alert(
            'Verification Required 📧',
            'Please check your email inbox to confirm your account verification link before logging in.'
          );
          setIsSignUp(false);
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data.session) {
          const role = data.session.user.user_metadata?.role || 'customer';
          login(role, data.session.user.id, data.session.access_token);
        }
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Brand Section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <Text style={styles.appName}>ApnaTask</Text>
            <Text style={styles.tagline}>Pakistan's Hyperlocal Services Marketplace</Text>
          </View>

          {/* Bottom Form Section */}
          <View style={styles.formSection}>
            {/* Tabs for In/Up */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.welcomeText}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.instructionText}>
              {isSignUp ? 'Sign up to find services or earn money' : 'Sign in to access your services'}
            </Text>

            {/* Role Selection (Only on Sign Up) */}
            {isSignUp && (
              <View style={styles.roleWrapper}>
                <Text style={styles.fieldLabel}>I WANT TO REGISTER AS A:</Text>
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
                      <User size={20} color={selectedRole === 'customer' ? Theme.colors.primary : Theme.colors.textTertiary} />
                    </View>
                    <Text style={[styles.roleTitle, selectedRole === 'customer' && styles.roleTitleActive]}>
                      Customer
                    </Text>
                    <Text style={styles.roleDesc}>Hire local providers</Text>
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
                      <Briefcase size={20} color={selectedRole === 'provider' ? Theme.colors.primary : Theme.colors.textTertiary} />
                    </View>
                    <Text style={[styles.roleTitle, selectedRole === 'provider' && styles.roleTitleActive]}>
                      Provider
                    </Text>
                    <Text style={styles.roleDesc}>Bid & earn money</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Form Fields */}
            {isSignUp && (
              <>
                <Input
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Ali Khan"
                  icon={<User size={18} color={Theme.colors.textTertiary} />}
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g., +92 300 1234567"
                  keyboardType="phone-pad"
                  icon={<Phone size={18} color={Theme.colors.textTertiary} />}
                />
                {selectedRole === 'provider' && (
                  <View style={styles.categorySelectContainer}>
                    <Text style={styles.fieldLabel}>SERVICE CATEGORY</Text>
                    <View style={styles.categoryGrid}>
                      {['plumber', 'electrician', 'cleaning', 'painting'].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            category === cat && styles.categoryChipActive,
                          ]}
                          onPress={() => setCategory(cat)}
                        >
                          <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g., name@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={18} color={Theme.colors.textTertiary} />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={18} color={Theme.colors.textTertiary} />}
            />

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                onPress={handleAuth}
                size="lg"
                loading={loading}
                icon={!loading && <ChevronRight size={20} color={Theme.colors.white} />}
              />
            </View>
          </View>
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandSection: {
    paddingVertical: Theme.spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: Theme.spacing.md,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.textOnPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  formSection: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxxl,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4E6EB',
    borderRadius: Theme.radius.md,
    padding: 3,
    marginBottom: Theme.spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Theme.radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.white,
    ...Theme.shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  tabTextActive: {
    color: Theme.colors.primary,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  roleWrapper: {
    marginBottom: Theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  roleCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F3FCF9',
  },
  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  roleIconActive: {
    backgroundColor: '#E8F5E9',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  roleTitleActive: {
    color: Theme.colors.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
  },
  categorySelectContainer: {
    marginBottom: Theme.spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  categoryChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F3FCF9',
  },
  categoryChipText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
  },
});
