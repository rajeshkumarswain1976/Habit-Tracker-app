import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('1');

  const loadHabits = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await mcp.call('getUserHabits');
      setHabits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const openCreate = () => {
    setEditingHabit(null);
    setTitle('');
    setGoal('1');
    setModalVisible(true);
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setGoal(String(habit.daily_goal));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }
    try {
      if (editingHabit) {
        await mcp.call('updateHabit', { habit_id: editingHabit.habit_id, title, daily_goal: parseInt(goal) || 1 });
      } else {
        await mcp.call('createHabit', { title, daily_goal: parseInt(goal) || 1 });
      }
      setModalVisible(false);
      setTitle('');
      setGoal('1');
      setEditingHabit(null);
      loadHabits();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (habit) => {
    Alert.alert(
      'Delete Habit',
      `Delete "${habit.title}"? All tracking data will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await mcp.call('deleteHabit', { habit_id: habit.habit_id });
            loadHabits();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }}
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.habitCard}>
      <View style={[styles.habitIconContainer, { backgroundColor: `rgba(129, 140, 248, ${0.15 + (index * 0.05)})` }]}>
        <MaterialCommunityIcons name={['checkbox-marked-circle-outline', 'star-outline', 'heart-outline', 'lightbulb-outline', 'trophy-outline'][index % 5]} size={24} color={theme.colors.primaryLight} />
      </View>
      <View style={styles.habitInfo}>
        <Text style={styles.habitTitle}>{item.title}</Text>
        <View style={styles.habitMeta}>
          <View style={styles.goalBadge}>
            <MaterialCommunityIcons name="target" size={12} color={theme.colors.primaryLight} />
            <Text style={styles.goalBadgeText}>{item.daily_goal}x / day</Text>
          </View>
          <Text style={styles.habitDate}>{format(new Date(item.created_at), 'MMM d')}</Text>
        </View>
      </View>
      <View style={styles.habitActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const SkeletonCard = () => (
    <View style={[styles.habitCard, styles.skeletonCard]}>
      <View style={[styles.skeleton, { width: 48, height: 48, borderRadius: 12 }]} />
      <View style={styles.habitInfo}>
        <View style={[styles.skeleton, { width: 120, height: 18, marginBottom: 8 }]} />
        <View style={[styles.skeleton, { width: 80, height: 14 }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Habits</Text>
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Track Progress</Text>
          <Text style={styles.title}>My Habits</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.habit_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHabits(true)} tintColor={theme.colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>Start building your daily routine</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={openCreate}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Create First Habit</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingHabit ? 'Edit Habit' : 'New Habit'}</Text>
            
            <Text style={styles.inputLabel}>Habit Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning meditation"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />
            
            <Text style={styles.inputLabel}>Daily Goal (times per day)</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={goal}
              onChangeText={setGoal}
              keyboardType="number-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingHabit ? 'Save Changes' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primaryLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  listContent: { padding: theme.spacing.lg, paddingBottom: 120 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skeletonCard: { opacity: 0.5 },
  habitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  habitMeta: { flexDirection: 'row', alignItems: 'center' },
  goalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(129, 140, 248, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radii.full, marginRight: theme.spacing.sm, gap: 4 },
  goalBadgeText: { color: theme.colors.primaryLight, fontSize: 11, fontWeight: '700' },
  habitDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  habitActions: { flexDirection: 'row' },
  actionBtn: { padding: theme.spacing.xs },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginTop: theme.spacing.lg },
  emptyText: { color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: theme.spacing.lg },
  primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.radii.full, gap: 8 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: theme.radii['3xl'],
    borderTopRightRadius: theme.radii['3xl'],
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 0,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: theme.spacing.xl },
  inputLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.md, gap: theme.spacing.md },
  cancelButton: { paddingHorizontal: 24, paddingVertical: 14 },
  cancelButtonText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 14 },
  saveButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.radii.full },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  
  skeleton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
});
