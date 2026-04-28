import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [timeRange, setTimeRange] = useState(30);
  const [analytics, setAnalytics] = useState({ trend: [], breakdown: [], overallStats: { totalTracked: 0, completionRate: 0, bestHabit: 'N/A' } });
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const [analyticsData, reports] = await Promise.all([
        mcp.call('getAnalyticsData', { timeRange }),
        mcp.call('getSavedReports'),
      ]);
      setAnalytics(analyticsData);
      setSavedReports(reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await mcp.call('generateReport');
      Alert.alert('Success', 'Report saved successfully.');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const StatCard = ({ icon, value, label, iconBg, color }) => (
    <View style={[styles.statCard, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} style={styles.statIcon} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const SkeletonCard = () => (
    <View style={[styles.statCard, styles.skeletonCard]}>
      <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 16, marginBottom: 8 }]} />
      <View style={[styles.skeleton, { width: 50, height: 24, marginBottom: 4 }]} />
      <View style={[styles.skeleton, { width: 70, height: 12 }]} />
    </View>
  );

  const renderTrendChart = () => {
    if (analytics.trend.length === 0) return null;
    
    const chartWidth = width - 96;
    const chartHeight = 120;
    const barWidth = chartWidth / analytics.trend.length;
    
    const getBarColor = (rate) => {
      if (rate >= 70) return '#34d399';
      if (rate >= 40) return '#fbbf24';
      return '#818cf8';
    };

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          {analytics.trend.map((item, index) => {
            const barHeight = Math.max((item.rate / 100) * chartHeight, 4);
            const isHighlight = index === analytics.trend.length - 1;
            const isFirst = index === 0;
            const isMid = index === Math.floor(analytics.trend.length / 2);
            const showLabel = isFirst || isMid || isHighlight;
            
            return (
              <View 
                key={index} 
                style={[
                  styles.chartBarContainer,
                  { width: barWidth }
                ]}
              >
                <Text style={styles.chartBarValue}>{item.rate}%</Text>
                <View style={[styles.chartBarWrapper, { height: chartHeight }]}>
                  <View 
                    style={[
                      styles.chartBar,
                      { 
                        height: barHeight,
                        backgroundColor: getBarColor(item.rate),
                        opacity: isHighlight ? 1 : 0.7,
                      }
                    ]} 
                  />
                </View>
                {showLabel && (
                  <Text style={[
                    styles.chartBarLabel,
                    isHighlight && styles.chartBarLabelActive
                  ]}>
                    {item.date}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        
        {/* Summary Stats */}
        <View style={styles.chartSummary}>
          <View style={styles.chartSummaryItem}>
            <View style={[styles.chartDot, { backgroundColor: '#34d399' }]} />
            <Text style={styles.chartSummaryText}>70%+ Excellent</Text>
          </View>
          <View style={styles.chartSummaryItem}>
            <View style={[styles.chartDot, { backgroundColor: '#fbbf24' }]} />
            <Text style={styles.chartSummaryText}>40-69% Good</Text>
          </View>
          <View style={styles.chartSummaryItem}>
            <View style={[styles.chartDot, { backgroundColor: '#818cf8' }]} />
            <Text style={styles.chartSummaryText}>&lt;40% Needs Work</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.filterRow}>
            {TIME_RANGES.map((range) => (
              <View key={range.value} style={[styles.filterChip, styles.skeleton]} />
            ))}
          </View>
          <View style={styles.statsGrid}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.colors.primaryLight} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>Insights</Text>
            <Text style={styles.title}>Analytics</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleGenerate} disabled={generating}>
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.value}
              style={[styles.filterChip, timeRange === range.value && styles.filterChipActive]}
              onPress={() => setTimeRange(range.value)}
            >
              <Text style={[styles.filterChipText, timeRange === range.value && styles.filterChipTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            icon="chart-arc" 
            value={`${analytics.overallStats.completionRate}%`} 
            label="Completion" 
            iconBg="rgba(129, 140, 248, 0.15)"
            color={theme.colors.primaryLight}
          />
          <StatCard 
            icon="calendar-check" 
            value={analytics.overallStats.totalTracked} 
            label="Days Tracked" 
            iconBg="rgba(52, 211, 153, 0.15)"
            color="#34d399"
          />
          <StatCard 
            icon="trophy" 
            value={analytics.overallStats.bestHabit !== 'N/A' ? (analytics.overallStats.bestHabit.length > 8 ? analytics.overallStats.bestHabit.slice(0, 8) + '...' : analytics.overallStats.bestHabit) : '—'} 
            label="Best Habit" 
            iconBg="rgba(251, 146, 60, 0.15)"
            color="#fb923c"
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.primaryLight} />
            <Text style={styles.sectionTitle}>Completion Trend</Text>
          </View>
          {analytics.trend.length > 0 ? (
            renderTrendChart()
          ) : (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="chart-line" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No data for this period</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#34d399" />
            <Text style={styles.sectionTitle}>Habit Breakdown ({analytics.breakdown.length} habits)</Text>
          </View>
          {analytics.breakdown.length > 0 ? (
            <View style={styles.breakdownContainer}>
              {analytics.breakdown.map((item, index) => {
                const barColor = ['#818cf8', '#34d399', '#fb923c', '#f472b6', '#38bdf8'][index % 5];
                const isExcellent = item.rate >= 70;
                
                return (
                  <View key={index} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <View style={styles.breakdownNameRow}>
                        <View style={[styles.breakdownIcon, { backgroundColor: barColor + '30' }]}>
                          <MaterialCommunityIcons name={['checkbox-marked-circle', 'star', 'heart', 'target', 'trophy'][index % 5]} size={16} color={barColor} />
                        </View>
                        <Text style={styles.breakdownName} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <View style={[styles.breakdownRateBadge, { backgroundColor: barColor + '30' }]}>
                        <Text style={[styles.breakdownRate, { color: barColor }]}>{item.rate}%</Text>
                        {isExcellent && <MaterialCommunityIcons name="check-circle" size={14} color={barColor} style={{ marginLeft: 4 }} />}
                      </View>
                    </View>
                    <View style={styles.breakdownBarBg}>
                      <View style={[styles.breakdownBarFill, { width: `${item.rate}%`, backgroundColor: barColor }]} />
                    </View>
                    <View style={styles.breakdownMeta}>
                      <Text style={styles.breakdownMetaText}>
                        <MaterialCommunityIcons name="check-circle" size={12} color="#34d399" /> {item.completed} completed
                      </Text>
                      <Text style={styles.breakdownMetaText}>
                        out of {item.total} days
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="chart-bar" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No habits to analyze</Text>
            </View>
          )}
        </View>

        {savedReports.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#f472b6" />
              <Text style={styles.sectionTitle}>Recent Reports</Text>
            </View>
            {savedReports.slice(0, 3).map((report) => (
              <View key={report.report_id} style={styles.reportItem}>
                <Text style={styles.reportDate}>{format(new Date(report.created_at), 'MMM d, yyyy')}</Text>
                <Text style={styles.reportSummary} numberOfLines={2}>{report.summary}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.full,
    gap: 6,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  
  filterRow: { flexDirection: 'row', marginBottom: theme.spacing.lg, gap: theme.spacing.sm },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterChipTextActive: { color: '#ffffff' },
  
  statsGrid: { flexDirection: 'row', marginBottom: theme.spacing.lg, gap: theme.spacing.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skeletonCard: { opacity: 0.5 },
  statIcon: { marginBottom: theme.spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  
  chartWrapper: {},
  chartContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    height: 150,
    paddingTop: 20,
  },
  chartBarContainer: { alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 2 },
  chartBarWrapper: { justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  chartBar: { width: '80%', borderRadius: 6, minHeight: 4 },
  chartBarValue: { fontSize: 8, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: '600' },
  chartBarLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: '500' },
  chartBarLabelActive: { color: theme.colors.primaryLight, fontWeight: '700' },
  chartSummary: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.lg, gap: theme.spacing.md },
  chartSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartDot: { width: 8, height: 8, borderRadius: 4 },
  chartSummaryText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  
  breakdownContainer: {},
  breakdownItem: { marginBottom: theme.spacing.xl },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  breakdownNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  breakdownName: { fontSize: 14, color: '#ffffff', flex: 1, fontWeight: '600' },
  breakdownRateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.full },
  breakdownRate: { fontSize: 14, fontWeight: '700' },
  breakdownBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 4 },
  breakdownMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  breakdownMetaText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  
  reportItem: { padding: theme.spacing.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: theme.radii.lg, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  reportDate: { fontSize: 11, fontWeight: '600', color: theme.colors.primaryLight, marginBottom: 4 },
  reportSummary: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  
  emptySection: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: theme.spacing.sm },
  
  skeleton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
});
