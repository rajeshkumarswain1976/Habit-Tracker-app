import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';
import { useAuth } from '../contexts/AuthContext';

export default function AdminScreen() {
  const { profile } = useAuth();
  const [adminData, setAdminData] = useState({ users: [], totalUsers: 0, totalHabits: 0, totalTracking: 0, totalGoals: 0, userActivity: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    if (profile?.role !== 'admin') {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await mcp.call('getAdminData');
      setAdminData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await mcp.call('generateReport');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.accessDenied}>
          <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#ff6b6b" />
          <Text style={styles.accessDeniedText}>Admin Access Required</Text>
          <Text style={styles.accessDeniedSubtext}>Contact your administrator for access</Text>
        </View>
      </LinearGradient>
    );
  }

  const StatCard = ({ icon, value, label, iconBg, color }) => (
    <View style={[styles.statCard, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} style={styles.statIcon} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const SkeletonCard = () => (
    <View style={[styles.statCard, styles.skeletonCard]}>
      <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 12, marginBottom: 8 }]} />
      <View style={[styles.skeleton, { width: 40, height: 24, marginBottom: 4 }]} />
      <View style={[styles.skeleton, { width: 60, height: 12 }]} />
    </View>
  );

  const renderActivityBar = (item, index, maxValue) => {
    const height = maxValue > 0 ? Math.min((Math.max(item.habits, item.completed) / maxValue) * 50, 50) : 0;
    return (
      <View key={index} style={styles.activityBarContainer}>
        <View style={[styles.activityBar, { height }]} />
        <Text style={styles.activityBarLabel} numberOfLines={1}>{item.name}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Supervisor Hub</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const maxActivity = Math.max(...adminData.userActivity.map(a => Math.max(a.habits, a.completed)), 1);
  const avgHabitsPerUser = adminData.totalUsers > 0 ? (adminData.totalHabits / adminData.totalUsers).toFixed(1) : '0';

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.colors.primaryLight} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>Supervisor</Text>
            <Text style={styles.title}>Admin Hub</Text>
          </View>
          <TouchableOpacity style={styles.reportButton} onPress={handleGenerateReport} disabled={generating}>
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="chart-bar" size={18} color="#fff" />
                <Text style={styles.reportButtonText}>Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            icon="account-group" 
            value={adminData.totalUsers} 
            label="Users" 
            iconBg="rgba(129, 140, 248, 0.15)"
            color={theme.colors.primaryLight}
          />
          <StatCard 
            icon="checkbox-marked-circle-outline" 
            value={adminData.totalHabits} 
            label="Habits" 
            iconBg="rgba(52, 211, 153, 0.15)"
            color="#34d399"
          />
          <StatCard 
            icon="clipboard-check-outline" 
            value={adminData.totalTracking} 
            label="Tracking" 
            iconBg="rgba(251, 146, 60, 0.15)"
            color="#fb923c"
          />
          <StatCard 
            icon="flag-outline" 
            value={adminData.totalGoals} 
            label="Goals" 
            iconBg="rgba(244, 114, 182, 0.15)"
            color="#f472b6"
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primaryLight} />
            <Text style={styles.sectionTitle}>User Activity</Text>
            <Text style={styles.sectionSubtitle}>Top performers</Text>
          </View>
          {adminData.userActivity.length > 0 ? (
            <View style={styles.activityContainer}>
              {adminData.userActivity.slice(0, 8).map((item, index) => renderActivityBar(item, index, maxActivity))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No activity data</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#34d399" />
            <Text style={styles.sectionTitle}>System Health</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Avg habits per user</Text>
            <View style={styles.healthValueBadge}>
              <Text style={styles.healthValue}>{avgHabitsPerUser}</Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Active users</Text>
            <View style={styles.healthValueBadge}>
              <Text style={styles.healthValue}>{adminData.totalUsers}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-multiple" size={20} color="#f472b6" />
            <Text style={styles.sectionTitle}>User Directory</Text>
            <Text style={styles.sectionSubtitle}>{adminData.users.length} total</Text>
          </View>
          {adminData.users.slice(0, 5).map((user) => {
            const initials = (user.name || user.email || '?')[0]?.toUpperCase() || '?';
            const isAdmin = user.role === 'admin';
            return (
              <View key={user.user_id} style={styles.userItem}>
                <View style={[styles.userAvatar, isAdmin && styles.userAvatarAdmin]}>
                  <Text style={styles.userAvatarText}>{initials}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name || 'Unnamed'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}>
                  <Text style={[styles.roleBadgeText, isAdmin && styles.roleBadgeTextAdmin]}>{user.role}</Text>
                </View>
              </View>
            );
          })}
        </View>
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
  label: { fontSize: 12, fontWeight: '600', color: '#f472b6', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f472b6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.full,
    gap: 6,
  },
  reportButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  
  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  accessDeniedText: { fontSize: 20, fontWeight: '700', color: '#ff6b6b', marginTop: theme.spacing.lg },
  accessDeniedSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.lg, gap: theme.spacing.md },
  statCard: {
    width: '48%',
    alignItems: 'center',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skeletonCard: { opacity: 0.5 },
  statIcon: { marginBottom: theme.spacing.sm },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1 },
  sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  
  activityContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 70, paddingTop: theme.spacing.sm },
  activityBarContainer: { alignItems: 'center', flex: 1 },
  activityBar: { width: 16, backgroundColor: theme.colors.primaryLight, borderRadius: 8, minHeight: 4 },
  activityBarLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' },
  
  healthItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  healthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  healthValueBadge: { backgroundColor: 'rgba(129, 140, 248, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radii.full },
  healthValue: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(129, 140, 248, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  userAvatarAdmin: { backgroundColor: 'rgba(244, 114, 182, 0.2)' },
  userAvatarText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.full },
  roleBadgeAdmin: { backgroundColor: 'rgba(244, 114, 182, 0.2)' },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  roleBadgeTextAdmin: { color: '#f472b6' },
  
  emptySection: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  
  skeleton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
});
