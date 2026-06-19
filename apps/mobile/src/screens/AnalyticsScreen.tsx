import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { analyticsAPI } from '../services/api';

const { width } = Dimensions.get('window');

interface ReviewMetric {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: number[];
  topRatedProducts: { id: string; title: string; avgRating: number; reviewCount: number }[];
  insights: { type: string; message: string }[];
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sellerRes, reviewsRes] = await Promise.all([
        analyticsAPI.seller(),
        analyticsAPI.reviews().catch(() => ({ data: null })),
      ]);
      setData(sellerRes.data);
      if (reviewsRes?.data) setReviews(reviewsRes.data);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#666', fontSize: 16 }}>No analytics data yet</Text>
      </View>
    );
  }

  const metrics = [
    { label: 'Total Products', value: data.totalProducts ?? 0 },
    { label: 'Total Sales', value: data.totalSales ?? 0 },
    { label: 'Total Revenue', value: `$${data.totalRevenue ?? 0}` },
    { label: 'Avg. Rating', value: reviews?.averageRating?.toFixed(1) ?? '—' },
  ];

  // Narrow reviews type for JSX
  const rev = reviews as ReviewMetric | null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7C3AED" />}
    >
      <Text style={styles.title}>Analytics</Text>

      {/* Metric cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Rating breakdown */}
      {rev?.totalReviews != null && rev.totalReviews > 0 && (
        <>
          <Text style={styles.sectionTitle}>Ratings Breakdown</Text>
          <View style={styles.card}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (rev!.ratingBreakdown[star] ?? 0);
              const pct = rev!.totalReviews > 0 ? (count / rev!.totalReviews) * 100 : 0;
              return (
                <View key={star} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ width: 30, color: '#999', fontSize: 13 }}>{star}★</Text>
                  <View style={{ flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4, marginHorizontal: 8 }}>
                    <View style={{ width: `${pct}%`, height: 8, backgroundColor: '#7C3AED', borderRadius: 4 }} />
                  </View>
                  <Text style={{ width: 30, color: '#999', fontSize: 12, textAlign: 'right' }}>{count}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Insights */}
      {rev?.insights != null && rev.insights.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Insights</Text>
          {rev.insights.map((ins, i) => (
            <View key={i} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: ins.type === 'praise' ? '#10b981' : ins.type === 'warning' ? '#f59e0b' : '#7C3AED' }]}>
              <Text style={{ color: '#ccc', fontSize: 13 }}>{ins.message}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#151515', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e1e1e' },
  metricCard: { width: (width - 52) / 2, backgroundColor: '#151515', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1e1e1e' },
  metricValue: { fontSize: 24, fontWeight: '800', color: '#7C3AED', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
});
