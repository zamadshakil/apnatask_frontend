// src/screens/customer/CreateTaskScreen.tsx — Premium task posting screen
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useAuth } from '../../navigation/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'plumber', label: 'Plumbing', icon: '🔧' },
  { id: 'electrician', label: 'Electrical', icon: '⚡' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'painting', label: 'Painting', icon: '🎨' },
  { id: 'carpenter', label: 'Carpentry', icon: '🪚' },
  { id: 'ac_repair', label: 'AC Repair', icon: '❄️' },
  { id: 'shifting', label: 'Shifting', icon: '📦' },
  { id: 'other', label: 'Other', icon: '➕' },
];

export default function CreateTaskScreen() {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a service category');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your task');
      return;
    }
    if (!budget || isNaN(parseFloat(budget))) {
      Alert.alert('Required', 'Please enter a valid budget');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', {
        customer_id: userId,
        amount: parseFloat(budget),
        customer_phone: phone || undefined,
      });
      Alert.alert(
        'Task Posted! 🎉',
        'Your service request has been posted. Providers in your area will start bidding shortly.',
        [{ text: 'OK' }]
      );
      // Reset form
      setSelectedCategory(null);
      setDescription('');
      setBudget('');
      setPhone('');
    } catch (err) {
      Alert.alert('Error', 'Failed to post task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>Post a New Task</Text>
          <Text style={styles.headerSubtitle}>
            Describe what you need — nearby providers will bid on your task
          </Text>
        </View>

        <View style={styles.content}>
          {/* Category Selection */}
          <Text style={styles.sectionLabel}>SERVICE CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Task Details */}
          <Text style={styles.sectionLabel}>TASK DETAILS</Text>
          <Input
            label="What do you need done?"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Fix leaking pipe under kitchen sink..."
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Input
            label="Your Budget (PKR)"
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g., 2500"
            keyboardType="numeric"
            hint="Providers will bid around this budget"
          />

          <Input
            label="Contact Number (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+92 3XX XXXXXXX"
            keyboardType="phone-pad"
          />

          {/* Price Guidance */}
          {selectedCategory && (
            <Card elevation="sm" style={styles.priceGuide}>
              <Text style={styles.priceGuideTitle}>💡 Price Guide</Text>
              <Text style={styles.priceGuideText}>
                Average price for {CATEGORIES.find(c => c.id === selectedCategory)?.label} services in your area: Rs. 1,500 - Rs. 5,000
              </Text>
            </Card>
          )}

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Post Task & Get Bids"
              onPress={handleSubmit}
              size="lg"
              loading={loading}
              disabled={!selectedCategory || !description.trim() || !budget}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.xxxl,
    borderBottomLeftRadius: Theme.radius.xxl,
    borderBottomRightRadius: Theme.radius.xxl,
  },
  headerTitle: {
    ...Theme.typography.h1,
    color: Theme.colors.textOnPrimary,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    ...Theme.typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.section,
  },
  sectionLabel: {
    ...Theme.typography.overline,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    gap: 6,
  },
  categoryChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F0FFF4',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  categoryLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceGuide: {
    backgroundColor: '#FFFDE7',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
  },
  priceGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  priceGuideText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  submitContainer: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.section,
  },
});
