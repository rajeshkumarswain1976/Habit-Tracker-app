import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, differenceInDays, isPast } from 'date-fns';
import { theme } from '../theme';
import { mcp } from '../services/mcpService';

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadGoals = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const data = await mcp.call('getUserGoals');
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const openCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setDeadline(null);
    setModalVisible(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.goal_title);
    setDeadline(goal.deadline ? new Date(goal.deadline) : null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    try {
      const deadlineStr = deadline ? format(deadline, 'yyyy-MM-dd') : null;
      if (editingGoal) {
        await mcp.call('updateGoal', { goal_id: editingGoal.goal_id, title, deadline: deadlineStr });
      } else {
        await mcp.call('createGoal', { title, deadline: deadlineStr });
      }
      setModalVisible(false);
      setTitle('');
      setDeadline(null);
      setEditingGoal(null);
      loadGoals();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await mcp.call('deleteGoal', { goal_id: id });
          loadGoals();
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      }}
    ]);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const getDeadlineInfo = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No deadline', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.1)' };
    const d = new Date(deadlineStr);
    const daysLeft = differenceInDays(d, new Date());

    if (isPast(d) && daysLeft < 0) return { text: `${Math.abs(daysLeft)}d overdue`, color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.2)' };
    if (daysLeft <= 3) return { text: `${daysLeft}d left`, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
    return { text: `${daysLeft}d left`, color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
  };

  const renderItem = ({ item, index }) => {
    const { text, color, bg } = getDeadlineInfo(item.deadline);
    return (
      <View style={styles.goalCard}>
        <View style={[styles.goalIconContainer, { backgroundColor: `rgba(52, 211, 153, ${0.15 + (index * 0.05)})` }]}>
          <MaterialCommunityIcons name="flag-variant" size={24} color="#34d399" />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{item.goal_title}</Text>
          {item.deadline && (
            <View style={styles.goalMeta}>
              <MaterialCommunityIcons name="calendar" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.goalDate}>{format(new Date(item.deadline), 'MMM d, yyyy')}</Text>
            </View>
          )}
        </View>
        <View style={[styles.deadlineBadge, { backgroundColor: bg }]}>
          <Text style={[styles.deadlineText, { color }]}>{text}</Text>
        </View>
        <View style={styles.goalActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.goal_id)}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const SkeletonCard = () => (
    <View style={[styles.goalCard, styles.skeletonCard]}>
      <View style={[styles.skeleton, { width: 48, height: 48, borderRadius: 12 }]} />
      <View style={styles.goalInfo}>
        <View style={[styles.skeleton, { width: 140, height: 18, marginBottom: 8 }]} />
        <View style={[styles.skeleton, { width: 80, height: 14 }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Objectives</Text>
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
          <Text style={styles.label}>Key Milestones</Text>
          <Text style={styles.title}>Objectives</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.goal_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadGoals(true)} tintColor={theme.colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="flag-variant-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No objectives yet</Text>
            <Text style={styles.emptyText}>Set milestones for your goals</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={openCreate}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGoal ? 'Edit Objective' : 'New Objective'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Goal Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Learn a new language"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />
            
            <Text style={styles.inputLabel}>Deadline (optional)</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={22} color={deadline ? '#34d399' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.dateButtonText, deadline && styles.dateButtonTextActive]}>
                {deadline ? format(deadline, 'MMMM d, yyyy') : 'Select a date'}
              </Text>
              {deadline && (
                <TouchableOpacity 
                  style={styles.clearDate}
                  onPress={() => setDeadline(null)}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Quick Date Selection */}
            <View style={styles.quickDates}>
              <TouchableOpacity 
                style={[styles.quickDateChip, deadline && styles.quickDateChipActive]}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDeadline(nextWeek);
                }}
              >
                <Text style={styles.quickDateText}>+1 Week</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateChip, deadline && styles.quickDateChipActive]}
                onPress={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setDeadline(nextMonth);
                }}
              >
                <Text style={styles.quickDateText}>+1 Month</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateChip, deadline && styles.quickDateChipActive]}
                onPress={() => {
                  const nextQuarter = new Date();
                  nextQuarter.setMonth(nextQuarter.getMonth() + 3);
                  setDeadline(nextQuarter);
                }}
              >
                <Text style={styles.quickDateText}>+3 Months</Text>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={deadline || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  textColor="#ffffff"
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity 
                    style={styles.datePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingGoal ? 'Save Changes' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

import DateTimePicker from '@react-native-community/datetimepicker';

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
  label: { fontSize: 12, fontWeight: '600', color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  addButton: {
    backgroundColor: '#34d399',
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  listContent: { padding: theme.spacing.lg, paddingBottom: 120 },
  goalCard: {
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
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  deadlineBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.full, marginRight: theme.spacing.sm },
  deadlineText: { fontSize: 11, fontWeight: '700' },
  goalActions: { flexDirection: 'row' },
  actionBtn: { padding: theme.spacing.xs },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginTop: theme.spacing.lg },
  emptyText: { color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: theme.spacing.lg },
  primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34d399', paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.radii.full, gap: 8 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateButtonText: { flex: 1, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: theme.spacing.md },
  dateButtonTextActive: { color: '#ffffff' },
  clearDate: { padding: 4 },
  quickDates: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  quickDateChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickDateChipActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  quickDateText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  datePickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  datePickerDone: { alignItems: 'center', padding: theme.spacing.md },
  datePickerDoneText: { color: theme.colors.primaryLight, fontSize: 16, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.md, gap: theme.spacing.md },
  cancelButton: { paddingHorizontal: 24, paddingVertical: 14 },
  cancelButtonText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 14 },
  saveButton: { backgroundColor: '#34d399', paddingHorizontal: 24, paddingVertical: 14, borderRadius: theme.radii.full },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  
  skeleton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
});
