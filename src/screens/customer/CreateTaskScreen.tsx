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
import { Wrench, Zap, Trash, Eye, PenTool, Snowflake, Box, Plus } from 'lucide-react-native';
import { Theme } from '../../styles/theme';
import { useAuth } from '../../navigation/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'plumber', label: 'Plumbing', icon: Wrench },
  { id: 'electrician', label: 'Electrical', icon: Zap },
  { id: 'cleaning', label: 'Cleaning', icon: Trash },
  { id: 'painting', label: 'Painting', icon: Eye }, // fallback representation
  { id: 'carpenter', label: 'Carpentry', icon: PenTool },
  { id: 'ac_repair', label: 'AC Repair', icon: Snowflake },
  { id: 'shifting', label: 'Shifting', icon: Box },
  { id: 'other', label: 'Other', icon: Plus },
];

interface CreateTaskScreenProps {
  initialCategory?: string | null;
  onClearCategory?: () => void;
}

export default function CreateTaskScreen({ initialCategory, onClearCategory }: CreateTaskScreenProps = {}) {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

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
        category: selectedCategory,
        description: description.trim(),
        customer_phone: phone || undefined,
      });
      Alert.alert(
        'Task Posted! 🎉',
        'Your service request has been posted. Providers in your area will start bidding shortly.',
        [{ text: 'OK' }]
      );
      // Reset form
      setSelectedCategory(null);
      if (onClearCategory) onClearCategory();
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <Card style={styles.bannerCard} elevation="md">
          <Text style={styles.bannerTitle}>Post a New Task</Text>
          <Text style={styles.bannerSubtitle}>
            Describe what you need done, and trusted service providers in your neighborhood will bid with their best prices.
          </Text>
        </Card>

        {/* Form Content */}
        <View style={styles.content}>
          {/* Category Selection */}
          <Text style={styles.sectionLabel}>SERVICE CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.75}
                >
                  <IconComp size={16} color={isSelected ? Theme.colors.primary : Theme.colors.textSecondary} />
                  <Text style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelActive,
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
            hint="Providers will submit bids close to this value"
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
            <Card style={styles.priceGuide} elevation="sm">
              <Text style={styles.priceGuideTitle}>💡 Average Price Range</Text>
              <Text style={styles.priceGuideText}>
                Placements in {CATEGORIES.find(c => c.id === selectedCategory)?.label} typically range between Rs. 1,200 and Rs. 4,500 based on complexity.
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
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  bannerCard: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.lg,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textOnPrimary,
    marginBottom: Theme.spacing.xs,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  content: {
    paddingBottom: Theme.spacing.section,
  },
  sectionLabel: {
    ...Theme.typography.overline,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    gap: 8,
    ...Theme.shadows.sm,
  },
  categoryChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F3FCF9',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  categoryLabelActive: {
    color: Theme.colors.primary,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  priceGuide: {
    backgroundColor: '#FFFDE7',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.warning,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  priceGuideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  priceGuideText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
  },
  submitContainer: {
    marginTop: Theme.spacing.md,
  },
});
