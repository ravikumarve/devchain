// src/screens/CreateJobScreen.tsx
// Fixed: uses gigsAPI (jobsAPI alias), correct field names,
// scroll fixed with flexGrow, proper error logging
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { gigsAPI } from '../services/api';

export default function CreateJobScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [skills, setSkills] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [category, setCategory] = useState('frontend');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['frontend', 'backend', 'mobile', 'devops', 'blockchain', 'ai_ml', 'design', 'other'];

  const handleCreate = async () => {
    setError('');

    // Validation
    if (!title.trim()) { setError('Job title is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }
    if (description.trim().length < 20) { setError('Description must be at least 20 characters.'); return; }
    if (!priceFrom) { setError('Minimum price is required.'); return; }
    if (!deliveryDays) { setError('Delivery days is required.'); return; }

    const priceFromCents = Math.round(parseFloat(priceFrom) * 100);
    const priceToCents = priceTo ? Math.round(parseFloat(priceTo) * 100) : undefined;

    if (priceFromCents < 1) { setError('Price must be greater than 0.'); return; }
    if (priceToCents && priceToCents < priceFromCents) {
      setError('Max price must be greater than min price.');
      return;
    }

    setLoading(true);
    try {
      await gigsAPI.create({
        title: title.trim(),
        description: description.trim(),
        priceFrom: priceFromCents,
        priceTo: priceToCents,
        currency: 'USD',
        deliveryDays: parseInt(deliveryDays),
        category,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        tags: skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 5),
      });

      Alert.alert('✅ Success', 'Your gig has been posted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.error
        || err.response?.data?.details?.[0]?.message
        || 'Failed to post gig. Please try again.';
      console.error('[CreateJobScreen] create gig failed:', {
        status: err.response?.status,
        error: message,
        data: err.response?.data,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fixed: contentContainerStyle flexGrow:1 for web scroll */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post a Gig</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.form}>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gig Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Build a React Native app"
              placeholderTextColor="#555"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what you offer, deliverables, process..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price Range (USD) <Text style={styles.required}>*</Text></Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>From $</Text>
                <TextInput
                  style={styles.input}
                  value={priceFrom}
                  onChangeText={setPriceFrom}
                  placeholder="50"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.budgetDash}>—</Text>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>To $ <Text style={styles.hint}>(optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  value={priceTo}
                  onChangeText={setPriceTo}
                  placeholder="500"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Delivery days */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Days <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={deliveryDays}
              onChangeText={setDeliveryDays}
              placeholder="7"
              placeholderTextColor="#555"
              keyboardType="number-pad"
            />
          </View>

          {/* Skills */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills <Text style={styles.hint}>(comma separated)</Text></Text>
            <TextInput
              style={styles.input}
              value={skills}
              onChangeText={setSkills}
              placeholder="React Native, TypeScript, Node.js"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>💼</Text>
            <Text style={styles.noticeText}>
              Your gig will be visible to all DevChain users. Deliver quality work to build your reputation.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>📋 Post Gig</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, paddingBottom: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#111',
  },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  required: { color: '#DC2626' },
  hint: { color: '#555', fontWeight: '400', textTransform: 'none', fontSize: 12 },
  input: {
    backgroundColor: '#111', borderRadius: 10, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222',
  },
  textarea: { minHeight: 140, paddingTop: 14 },
  categoryScroll: { marginTop: 4 },
  categoryBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222',
  },
  categoryBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  categoryText: { color: '#666', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  budgetInput: { flex: 1 },
  budgetLabel: { fontSize: 12, color: '#666', marginBottom: 6, fontWeight: '600' },
  budgetDash: { color: '#555', fontSize: 20, marginBottom: 14 },
  notice: {
    flexDirection: 'row', gap: 10, backgroundColor: '#0d1a0d', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#05966933', marginBottom: 20, alignItems: 'center',
  },
  noticeIcon: { fontSize: 20 },
  noticeText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  errorBox: {
    backgroundColor: '#DC262622', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#DC262644', marginBottom: 12,
  },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  submitBtn: { backgroundColor: '#059669', borderRadius: 14, padding: 18, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
