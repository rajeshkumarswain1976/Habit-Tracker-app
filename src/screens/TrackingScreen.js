import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, subDays } from 'date-fns';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

export default function TrackingScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const [h, t] = await Promise.all([
        mcp.call('getUserHabits'),
        mcp.call('getTracking', { date: dateStr })
      ]);
      setHabits(h);
      setTrackingData(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goToToday = () => setCurrentDate(new Date());

  const toggleHabit = async (habitId, currentStatus, notes) => {
    const newStatus = !currentStatus;
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    setSaving(prev => ({ ...prev, [habitId]: true }));
    
    setTrackingData(prev => {
      const existing = prev.find(t => t.habit_id === habitId);
      if (existing) {
        return prev.map(t => t.habit_id === habitId ? { ...t, status: newStatus, notes } : t);
      }
      return [...prev, { habit_id: habitId, status: newStatus, notes }];
    });

    try {
      await mcp.call('trackHabit', { habit_id: habitId, date: dateStr, status: newStatus, notes });
    } catch (err) {
      console.error(err);
      loadData();
    } finally {
      setSaving(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const updateNotes = async (habitId, status, notes) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    try {
      await mcp.call('trackHabit', { habit_id: habitId, date: dateStr, status: status || false, notes });
    } catch (err) {
      console.error(err);
    }
  };

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const completedCount = trackingData.filter(t => t.status).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const renderItem = ({ item, index }) => {
    const trackingRecord = trackingData.find(t => t.habit_id === item.habit_id) || {};
    const isCompleted = trackingRecord.status || false;
    const notes = trackingRecord.notes || '';
    const isSaving = saving[item.habit_id];

    return (
      <View style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}>
        <TouchableOpacity 
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]} 
          onPress={() => toggleHabit(item.habit_id, isCompleted, notes)}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isCompleted ? (
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
          ) : null}
        </TouchableOpacity>
        
        <View style={styles.habitInfo}>
          <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>{item.title}</Text>
          <View style={styles.habitMeta}>
            <MaterialCommunityIcons name="target" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.goalText}>Goal: {item.daily_goal}x / day</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#34d399" />
                <Text style={styles.completedBadgeText}>Done</Text>
              </View>
            )}
          </View>
        </View>
        
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          defaultValue={notes}
          onEndEditing={(e) => updateNotes(item.habit_id, isCompleted, e.nativeEvent.text)}
        />
      </View>
    );
  };

  const SkeletonCard = () => (
    <View style={[styles.habitCard, styles.skeletonCard]}>
      <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 16 }]} />
      <View style={styles.habitInfo}>
        <View style={[styles.skeleton, { width: 140, height: 18, marginBottom: 8 }]} />
        <View style={[styles.skeleton, { width: 80, height: 14 }]} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.label}>Daily Tracking</Text>
          <Text style={styles.title}>Today's Rhythm</Text>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressSection}>
          <View style={styles.progressCircle}>
            <View style={styles.progressRingBg} />
            <View style={[styles.progressRingFill, { 
              transform: [{ rotate: `${(progressPercent / 100) * 360}deg` }] 
            }]} />
            <View style={styles.progressInner}>
              <Text style={styles.progressValue}>{progressPercent}%</Text>
              <Text style={styles.progressLabel}>Daily Flow</Text>
            </View>
          </View>
          <Text style={styles.progressText}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color="#34d399" /> {completedCount} of {totalCount} completed
          </Text>
        </View>

        {/* Date Navigator */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentDate(subDays(currentDate, 1))}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateText}>{format(currentDate, 'MMMM d, yyyy')}</Text>
            {!isToday && (
              <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
                <MaterialCommunityIcons name="calendar-today" size={12} color={theme.colors.primaryLight} />
                <Text style={styles.todayBtnText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentDate(addDays(currentDate, 1))}>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Habits List */}
        {loading ? (
          <View style={styles.listContent}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No habits to track</Text>
            <Text style={styles.emptyText}>Create some habits first</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {habits.map((item, index) => (
              <View key={item.habit_id}>{renderItem({ item, index })}</View>
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
  header: { marginBottom: theme.spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  
  progressSection: { alignItems: 'center', marginBottom: theme.spacing.xl },
  progressCircle: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  progressRingBg: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressRingFill: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: theme.colors.primaryLight,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressInner: { alignItems: 'center' },
  progressValue: { fontSize: 36, fontWeight: '800', color: '#ffffff' },
  progressLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  progressText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateCenter: { alignItems: 'center' },
  dateText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  todayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(129, 140, 248, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radii.full, marginTop: 6, gap: 4 },
  todayBtnText: { color: theme.colors.primaryLight, fontSize: 12, fontWeight: '700' },
  
  listContent: { paddingBottom: theme.spacing.lg },
  habitCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  habitCardCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  skeletonCard: { opacity: 0.5 },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  checkboxCompleted: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  habitInfo: { marginBottom: theme.spacing.sm },
  habitTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.5)' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginRight: theme.spacing.sm },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52, 211, 153, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radii.full, gap: 4 },
  completedBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginTop: theme.spacing.lg },
  emptyText: { color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  
  skeleton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
});
