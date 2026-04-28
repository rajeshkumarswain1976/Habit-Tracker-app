import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

const HABIT_ICONS = [
  'run', 'walk', 'bike', 'swim', 'yoga', 'dumbbell', 'meditation', 'book-open-variant',
  'water', 'apple', 'food-apple', 'coffee', 'moon-waning-crescent', 'weather-sunny',
  'music', 'palette', 'code-tags', 'lightbulb', 'heart-pulse', 'brain',
];

const ALL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Small daily improvements lead to staggering results.", author: "Robin Sharma" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It does not matter how slowly you go as long as you don't stop.", author: "Confucius" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "We are what we repeatedly do. Excellence is a habit.", author: "Aristotle" },
  { text: "Your habits will determine your future.", author: "Jack Canfield" },
  { text: "First solve the problem, then write the code.", author: "John Johnson" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Progress is impossible without change.", author: "George Bernard Shaw" },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

const getHabitIcon = (index) => HABIT_ICONS[index % HABIT_ICONS.length];

const getQuotesForUser = (userId) => {
  if (!userId) return ALL_QUOTES;
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const startIndex = hash % ALL_QUOTES.length;
  const rotated = [...ALL_QUOTES.slice(startIndex), ...ALL_QUOTES.slice(0, startIndex)];
  return rotated;
};

function UserDashboard({ stats, loading, refreshing, loadStats, navigation, quotes, heatmapRange, setHeatmapRange }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (quotes.length > 1) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        
        setTimeout(() => {
          setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 200);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [quotes.length, fadeAnim]);

  const completionRate = stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0;

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loadingGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonCard, { opacity: 0.5 }]} />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStats(true)} tintColor="#fff" />}
    >
      {/* Quote Carousel */}
      <Animated.View style={[styles.quoteCard, { opacity: fadeAnim }]}>
        <View style={styles.quoteHeader}>
          <MaterialCommunityIcons name="format-quote-open" size={24} color="#818cf8" />
          <Text style={styles.quoteNum}>{currentQuoteIndex + 1}/{quotes.length}</Text>
        </View>
        <Text style={styles.quoteText}>"{quotes[currentQuoteIndex].text}"</Text>
        <Text style={styles.quoteAuthor}>— {quotes[currentQuoteIndex].author}</Text>
      </Animated.View>
      <View style={styles.quoteDots}>
        {quotes.map((_, index) => (
          <TouchableOpacity key={index} onPress={() => setCurrentQuoteIndex(index)}>
            <View 
              style={[
                styles.quoteDot,
                { backgroundColor: index === currentQuoteIndex ? '#818cf8' : 'rgba(255,255,255,0.2)' }
              ]} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Heatmap */}
      <View style={styles.heatmapCard}>
        <View style={styles.heatmapHeader}>
          <View style={styles.heatmapTitleRow}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#818cf8" />
            <Text style={styles.heatmapTitle}>Activity</Text>
          </View>
          <View style={styles.rangeSelector}>
            {[30, 60, 90].map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.rangeBtn, heatmapRange === days && styles.rangeBtnActive]}
                onPress={() => setHeatmapRange(days)}
              >
                <Text style={[styles.rangeBtnText, heatmapRange === days && styles.rangeBtnTextActive]}>
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {stats.heatmapData.length > 0 ? (
          <>
            <View style={styles.heatmapGrid}>
              {stats.heatmapData.map((day, index) => {
                const getGithubColor = (intensity) => {
                  if (intensity === 0) return '#161b22';
                  if (intensity < 20) return '#0e4429';
                  if (intensity < 40) return '#006d32';
                  if (intensity < 60) return '#26a641';
                  if (intensity < 80) return '#39d353';
                  return '#58a6ff';
                };
                return <View key={index} style={[styles.heatmapCell, { backgroundColor: getGithubColor(day.intensity) }]} />;
              })}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.heatmapLegendText}>Less</Text>
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#161b22' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#0e4429' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#006d32' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#26a641' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#39d353' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#58a6ff' }]} />
              <Text style={styles.heatmapLegendText}>More</Text>
            </View>
          </>
        ) : (
          <View style={styles.heatmapEmpty}>
            <MaterialCommunityIcons name="chart-line" size={32} color={theme.colors.textMuted} />
            <Text style={styles.heatmapEmptyText}>No activity data yet</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
          <MaterialCommunityIcons name="checkbox-marked-circle" size={28} color="#818cf8" />
          <Text style={styles.statValue}>{stats.totalHabits}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
          <MaterialCommunityIcons name="fire" size={28} color="#fb923c" />
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
          <MaterialCommunityIcons name="flag-variant" size={28} color="#22c55e" />
          <Text style={styles.statValue}>{stats.activeGoals}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#38bdf8" />
          <Text style={styles.statValue}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color="#818cf8" />
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{completionRate}%</Text>
          </View>
        </View>
        {stats.weekData.length > 0 && stats.totalHabits > 0 ? (
          <View style={styles.progressChart}>
            {stats.weekData.map((item, index) => {
              const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
              const isHighlight = index === stats.weekData.length - 1;
              const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#fbbf24' : '#818cf8';
              return (
                <View key={index} style={styles.progressDay}>
                  <Text style={[styles.progressPct, { color }]}>{pct}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { height: `${Math.max(pct, 5)}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.progressLabel, isHighlight && styles.progressLabelActive]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-line" size={40} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Create habits to track progress</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Habits')}>
              <Text style={styles.actionBtnText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Today's Focus */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="target" size={20} color="#ec4899" />
          <Text style={styles.sectionTitle}>Today's Focus</Text>
          {stats.todayRemaining.length > 0 && (
            <View style={styles.focusBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#ec4899" />
              <Text style={styles.focusBadgeText}>{stats.todayRemaining.length} left</Text>
            </View>
          )}
        </View>
        {stats.todayRemaining.length > 0 ? (
          <View style={styles.taskList}>
            {stats.todayRemaining.slice(0, 5).map((habit, index) => (
              <TouchableOpacity 
                key={habit.habit_id} 
                style={styles.taskItem}
                onPress={() => navigation.navigate('Tracking')}
              >
                <View style={[styles.taskIcon, { backgroundColor: `rgba(99, 102, 241, ${0.15 + index * 0.05})` }]}>
                  <MaterialCommunityIcons name={getHabitIcon(index)} size={22} color="#818cf8" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{habit.title}</Text>
                  <Text style={styles.taskMeta}>Goal: {habit.daily_goal || 1}x daily</Text>
                </View>
                <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={26} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : stats.totalHabits > 0 ? (
          <View style={styles.successState}>
            <MaterialCommunityIcons name="party-popper" size={48} color="#22c55e" />
            <Text style={styles.successTitle}>All Done!</Text>
            <Text style={styles.emptyText}>You've crushed it today! 🎉</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="playlist-check" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No habits yet</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Habits')}>
              <Text style={styles.actionBtnText}>Create First Habit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function AdminDashboard() {
  const [adminData, setAdminData] = useState({ totalUsers: 0, totalHabits: 0, totalTracking: 0, totalGoals: 0, userActivity: [] });
  const [loading, setLoading] = useState(true);

  const loadAdminStats = useCallback(async () => {
    try {
      const data = await mcp.call('getAdminData');
      setAdminData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdminStats(); }, [loadAdminStats]);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loadingGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonCard, { opacity: 0.5 }]} />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.adminHeader}>
        <LinearGradient colors={['#ec4899', '#f472b6']} style={styles.adminIcon}>
          <MaterialCommunityIcons name="shield-account" size={32} color="#fff" />
        </LinearGradient>
        <View>
          <Text style={styles.adminTitle}>Admin Panel</Text>
          <Text style={styles.adminSubtitle}>System Overview</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
          <MaterialCommunityIcons name="account-group" size={28} color="#818cf8" />
          <Text style={styles.statValue}>{adminData.totalUsers}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
          <MaterialCommunityIcons name="checkbox-marked-circle" size={28} color="#22c55e" />
          <Text style={styles.statValue}>{adminData.totalHabits}</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
          <MaterialCommunityIcons name="clipboard-check" size={28} color="#38bdf8" />
          <Text style={styles.statValue}>{adminData.totalTracking}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
          <MaterialCommunityIcons name="flag-variant" size={28} color="#ec4899" />
          <Text style={styles.statValue}>{adminData.totalGoals}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-group" size={20} color="#818cf8" />
          <Text style={styles.sectionTitle}>User Activity</Text>
        </View>
        {adminData.userActivity.slice(0, 8).map((user, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[styles.activityAvatar, { backgroundColor: `rgba(99, 102, 241, ${0.15 + index * 0.05})` }]}>
              <Text style={styles.activityAvatarText}>{(user.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{user.name}</Text>
              <Text style={styles.activityMeta}>{user.habits} habits • {user.completed} tracked</Text>
            </View>
            <View style={styles.activityBar}>
              <View 
                style={[
                  styles.activityFill, 
                  { 
                    width: `${Math.min((user.completed / Math.max(adminData.totalTracking, 1)) * 100, 100)}%`,
                    backgroundColor: ['#818cf8', '#22c55e', '#fbbf24', '#ec4899', '#38bdf8'][index % 5]
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { user, signOut, profile } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalHabits: 0, completedToday: 0, streak: 0, activeGoals: 0,
    weekData: [], todayRemaining: [], heatmapData: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [heatmapRange, setHeatmapRange] = useState(30);

  const isAdmin = profile?.role === 'admin';
  const quotes = getQuotesForUser(user?.id);

  const loadStats = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await mcp.call('getDashboardData', { heatmapDays: heatmapRange });
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [heatmapRange]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.loadingHeader} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#312e81']} style={styles.container}>
      <View style={styles.header}>
        <View>
          {isAdmin ? (
            <>
              <Text style={styles.greeting}>Admin Panel 🛡️</Text>
              <Text style={styles.subtitle}>System Management</Text>
            </>
          ) : (
            <>
              <Text style={styles.greeting}>Hello, {user?.profile?.name || 'there'} 👋</Text>
              <Text style={styles.subtitle}>Let's crush your goals!</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => setShowMenu(!showMenu)}>
          <MaterialCommunityIcons name="account-circle" size={36} color="#fff" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <TouchableOpacity style={styles.menuDropdown} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      )}

      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <UserDashboard 
          stats={stats} 
          loading={loading} 
          refreshing={refreshing} 
          loadStats={loadStats} 
          navigation={navigation}
          quotes={quotes}
          heatmapRange={heatmapRange}
          setHeatmapRange={setHeatmapRange}
        />
      )}
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
    paddingTop: 50,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  menuDropdown: {
    position: 'absolute',
    top: 100,
    right: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    zIndex: 100,
  },
  menuText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  
  loadingHeader: { height: 100 },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  skeletonCard: { width: '47%', height: 100, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: theme.radii.xl },
  
  quoteCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: theme.spacing.md,
  },
  quoteDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: theme.spacing.sm },
  quoteDot: { width: 8, height: 8, borderRadius: 4 },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  quoteNum: { fontSize: 12, color: theme.colors.textMuted },
  quoteText: { fontSize: 15, color: '#fff', fontStyle: 'italic', lineHeight: 22 },
  quoteAuthor: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 12, fontWeight: '600' },
  
  heatmapCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heatmapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  heatmapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heatmapTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  rangeSelector: { flexDirection: 'row', gap: 6, backgroundColor: 'rgba(30, 41, 59, 0.8)', paddingHorizontal: 4, paddingVertical: 4, borderRadius: theme.radii.md },
  rangeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radii.sm, minWidth: 36, alignItems: 'center' },
  rangeBtnActive: { backgroundColor: '#6366f1' },
  rangeBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  rangeBtnTextActive: { color: '#fff' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: theme.spacing.md },
  heatmapCell: { width: 14, height: 14, borderRadius: 3 },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: theme.spacing.md, gap: 4 },
  heatmapLegendText: { fontSize: 10, color: theme.colors.textMuted },
  heatmapLegendCell: { width: 12, height: 12, borderRadius: 2 },
  heatmapEmpty: { alignItems: 'center', paddingVertical: theme.spacing.lg },
  heatmapEmptyText: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing.sm },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  statCard: {
    width: '47%',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: theme.spacing.sm },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, fontWeight: '600' },
  
  sectionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  progressBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  progressBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  focusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(236, 72, 153, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radii.full },
  focusBadgeText: { color: '#ec4899', fontWeight: '600', fontSize: 12 },
  
  progressChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  progressDay: { alignItems: 'center', flex: 1 },
  progressPct: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  progressBar: { width: 24, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  progressFill: { width: '100%', borderRadius: 12 },
  progressLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 8, fontWeight: '600' },
  progressLabelActive: { color: '#818cf8' },
  
  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  emptyText: { color: theme.colors.textSecondary, fontSize: 14, marginTop: theme.spacing.sm },
  actionBtn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radii.full, marginTop: theme.spacing.md },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  successState: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#22c55e', marginTop: theme.spacing.sm },
  
  taskList: { gap: theme.spacing.sm },
  taskItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  taskMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  
  adminHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.xl, paddingTop: 20 },
  adminIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  adminTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  adminSubtitle: { fontSize: 14, color: '#ec4899', marginTop: 4 },
  
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  activityAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  activityAvatarText: { color: '#818cf8', fontWeight: '700', fontSize: 16 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  activityMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  activityBar: { width: 60, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  activityFill: { height: '100%', borderRadius: 3 },
});
