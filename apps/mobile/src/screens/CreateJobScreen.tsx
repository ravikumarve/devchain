import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { jobsAPI } from '../services/api';

export default function CreateJobScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!title || !description || !budgetMin || !budgetMax) {
      setError('Please fill in all required fields.');
      return;
    }
    if (parseFloat(budgetMin) >= parseFloat(budgetMax)) {
      setError('Max budget must be greater than min budget.');
      return;
    }
    setLoading(true);
    try {
      await jobsAPI.create({
        title: title.trim(),
        description: description.trim(),
        budgetMin: parseFloat(budgetMin),
        budgetMax: parseFloat(budgetMax),
        skillsRequired: skills.split(',').map(s => s.trim()).filter(Boolean),
        deadline: deadline || undefined,
      });
      window.alert('✅ Job posted successfully!');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post a Job</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.form}>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Build a React Native app"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the project, requirements, deliverables..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget Range (USD) <Text style={styles.required}>*</Text></Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Min $</Text>
                <TextInput
                  style={styles.input}
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="500"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.budgetDash}>—</Text>
              <View style={styles.budgetInput}>
                <Text style={styles.budgetLabel}>Max $</Text>
                <TextInput
                  style={styles.input}
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="1500"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills Required <Text style={styles.hint}>(comma separated)</Text></Text>
            <TextInput
              style={styles.input}
              value={skills}
              onChangeText={setSkills}
              placeholder="React Native, TypeScript, Node.js"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline <Text style={styles.hint}>(optional, YYYY-MM-DD)</Text></Text>
            <TextInput
              style={styles.input}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="2026-04-30"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>💼</Text>
            <Text style={styles.noticeText}>
              Your job will be visible to all DevChain developers. Review proposals and hire the best fit.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>📋 Post Job</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#111' },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: '#DC2626' },
  hint: { color: '#555', fontWeight: '400', textTransform: 'none', fontSize: 12 },
  input: { backgroundColor: '#111', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222' },
  textarea: { minHeight: 140, paddingTop: 14 },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  budgetInput: { flex: 1 },
  budgetLabel: { fontSize: 12, color: '#666', marginBottom: 6, fontWeight: '600' },
  budgetDash: { color: '#555', fontSize: 20, marginBottom: 14 },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: '#0d1a0d', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#05966933', marginBottom: 20, alignItems: 'center' },
  noticeIcon: { fontSize: 20 },
  noticeText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  submitBtn: { backgroundColor: '#059669', borderRadius: 14, padding: 18, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
