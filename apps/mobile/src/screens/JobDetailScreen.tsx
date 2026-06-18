import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  skillsRequired: string[];
  status: string;
  deadline: string | null;
  client: { id: string; username: string; reputationScore: number };
  proposalCount: number;
  proposals?: any[];
}

export default function JobDetailScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetchJob(); }, []);

  const fetchJob = async () => {
    try {
      const res = await jobsAPI.getOne(jobId);
      setJob(res.data.job);
    } catch {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async () => {
    if (!coverLetter || !bidAmount) {
      window.alert('Please fill in all fields.');
      return;
    }
    if (isNaN(parseFloat(bidAmount))) {
      window.alert('Please enter a valid bid amount.');
      return;
    }
    setSubmitting(true);
    try {
      await jobsAPI.submitProposal(jobId, {
        coverLetter: coverLetter.trim(),
        bidAmount: parseFloat(bidAmount),
      });
      setSubmitted(true);
      setShowProposal(false);
      window.alert('✅ Proposal submitted successfully!');
      fetchJob();
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (!job) return null;

  const isClient = job.client.id === user?.id;
  const isClosed = job.status !== 'open';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, isClosed && styles.statusClosed]}>
            <Text style={[styles.statusText, isClosed && styles.statusTextClosed]}>
              {job.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title & Budget */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budget}>${job.budgetMin} – ${job.budgetMax}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {job.client.username[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.clientName}>@{job.client.username}</Text>
            <Text style={styles.clientRep}>⭐ {job.client.reputationScore} reputation</Text>
          </View>
          <View style={styles.proposalsBox}>
            <Text style={styles.proposalsNum}>{job.proposalCount}</Text>
            <Text style={styles.proposalsLabel}>proposals</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Skills */}
        {job.skillsRequired?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skills}>
              {job.skillsRequired.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Deadline */}
        {job.deadline && (
          <View style={styles.deadlineBox}>
            <Text style={styles.deadlineIcon}>🗓️</Text>
            <Text style={styles.deadlineText}>
              Deadline: {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        )}

        {/* Proposal Form */}
        {showProposal && (
          <View style={styles.proposalForm}>
            <Text style={styles.proposalTitle}>Submit Your Proposal</Text>

            <Text style={styles.label}>Your Bid (USD)</Text>
            <View style={styles.bidRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder="500"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.label}>Cover Letter</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Explain why you're the best fit for this job, your relevant experience, and your approach..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.proposalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowProposal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitProposalBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmitProposal}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitProposalText}>Submit 🚀</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      {!showProposal && (
        <View style={styles.bottomBar}>
          {isClient ? (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerText}>📋 Your Job Posting</Text>
            </View>
          ) : isClosed ? (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>🔒 This job is closed</Text>
            </View>
          ) : submitted ? (
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedText}>✅ Proposal Submitted!</Text>
            </View>
          ) : !isAuthenticated ? (
            <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.applyBtnText}>Login to Apply</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowProposal(true)}>
              <Text style={styles.applyBtnText}>Submit Proposal 💼</Text>
              <Text style={styles.applyBtnSub}>Bid on this job</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  statusBadge: { backgroundColor: '#05966922', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusClosed: { backgroundColor: '#DC262622' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  statusTextClosed: { color: '#DC2626' },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12, lineHeight: 30 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  budget: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED' },
  clientRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 12, padding: 14, marginBottom: 20, gap: 12
  },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center'
  },
  clientAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  clientName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  clientRep: { color: '#666', fontSize: 12, marginTop: 2 },
  proposalsBox: { marginLeft: 'auto', alignItems: 'center' },
  proposalsNum: { color: '#7C3AED', fontWeight: 'bold', fontSize: 22 },
  proposalsLabel: { color: '#666', fontSize: 11 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  description: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#1a0a2e', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#7C3AED44' },
  skillText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  deadlineBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 20 },
  deadlineIcon: { fontSize: 20 },
  deadlineText: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },
  proposalForm: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginTop: 8, borderWidth: 1, borderColor: '#7C3AED33' },
  proposalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dollar: { fontSize: 24, fontWeight: 'bold', color: '#7C3AED' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222' },
  textarea: { minHeight: 140, paddingTop: 14, marginBottom: 16, textAlignVertical: 'top' },
  proposalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  submitProposalBtn: { flex: 2, backgroundColor: '#7C3AED', borderRadius: 10, padding: 14, alignItems: 'center' },
  submitProposalText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  applyBtn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 18, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  applyBtnSub: { color: '#c4b5fd', fontSize: 12, marginTop: 2 },
  ownerBadge: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#7C3AED' },
  ownerText: { color: '#7C3AED', fontSize: 16, fontWeight: 'bold' },
  closedBadge: { backgroundColor: '#1a0a0a', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#DC2626' },
  closedText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  submittedBadge: { backgroundColor: '#0a1a0a', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#059669' },
  submittedText: { color: '#059669', fontSize: 16, fontWeight: 'bold' },
});
