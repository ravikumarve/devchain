import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { productsAPI } from '../services/api';

const CATEGORIES = [
  'react-components', 'node-packages', 'python-scripts',
  'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'
];

export default function CreateProductScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('react-components');
  const [tags, setTags] = useState('');
  const [techStack, setTechStack] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!title || !description || !price || !category) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    setLoading(true);
    try {
      const res = await productsAPI.create({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        techStack: techStack.split(',').map(t => t.trim()).filter(Boolean),
        previewUrl: previewUrl.trim() || undefined,
      });
      window.alert('✅ Product listed successfully!');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List a Product</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.form}>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. React Dashboard Template"
              placeholderTextColor="#555"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what buyers get, features, use cases..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (USD) <Text style={styles.required}>*</Text></Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={price}
                onChangeText={setPrice}
                placeholder="29.99"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags <Text style={styles.hint}>(comma separated)</Text></Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="react, dashboard, typescript"
              placeholderTextColor="#555"
            />
          </View>

          {/* Tech Stack */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tech Stack <Text style={styles.hint}>(comma separated)</Text></Text>
            <TextInput
              style={styles.input}
              value={techStack}
              onChangeText={setTechStack}
              placeholder="React, TypeScript, Tailwind"
              placeholderTextColor="#555"
            />
          </View>

          {/* Preview URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preview URL <Text style={styles.hint}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              value={previewUrl}
              onChangeText={setPreviewUrl}
              placeholder="https://demo.yourproduct.com"
              placeholderTextColor="#555"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Blockchain notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>🔐</Text>
            <Text style={styles.noticeText}>
              Every sale generates a unique SHA-256 blockchain certificate for the buyer.
            </Text>
          </View>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>🚀 List Product</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingBottom: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#111'
  },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: '#DC2626' },
  hint: { color: '#555', fontWeight: '400', textTransform: 'none', fontSize: 12 },
  input: {
    backgroundColor: '#111', borderRadius: 10, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222'
  },
  textarea: { minHeight: 120, paddingTop: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceDollar: { fontSize: 24, fontWeight: 'bold', color: '#7C3AED' },
  priceInput: { flex: 1 },
  categoryScroll: { marginTop: 4 },
  catChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#333', marginRight: 8
  },
  catChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  catChipText: { color: '#666', fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  notice: {
    flexDirection: 'row', gap: 10, backgroundColor: '#0d0d1a',
    borderRadius: 10, padding: 14, borderWidth: 1,
    borderColor: '#7C3AED33', marginBottom: 20, alignItems: 'center'
  },
  noticeIcon: { fontSize: 20 },
  noticeText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#7C3AED', borderRadius: 14, padding: 18, alignItems: 'center'
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
