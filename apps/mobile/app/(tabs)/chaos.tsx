import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { DailyChaosItem, DailyChaosStats, ChaosPriority, ChaosStatus } from '@aadda/shared';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  InputField,
  Modal,
  Dropdown,
  EmptyState,
  LoadingState,
  ErrorState,
  ConfirmationDialog,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'LOW', color: '#10B981', emoji: '🟢' },
  { label: 'Medium', value: 'MEDIUM', color: '#38BDF8', emoji: '🔵' },
  { label: 'High', value: 'HIGH', color: '#F59E0B', emoji: '🟡' },
  { label: 'Critical', value: 'CRITICAL', color: '#EF4444', emoji: '🔴' },
];

const CATEGORY_OPTIONS = [
  { label: 'General', value: 'General', emoji: '⚡' },
  { label: 'Work & Code', value: 'Work & Code', emoji: '💻' },
  { label: 'Personal', value: 'Personal', emoji: '🌟' },
  { label: 'Health', value: 'Health', emoji: '🏃' },
  { label: 'Hangout', value: 'Hangout', emoji: '☕' },
  { label: 'Challenge', value: 'Challenge', emoji: '🔥' },
];

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All Tasks', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function DailyChaosScreen() {
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const user = useAuthStore((state) => state.user);

  // Data state
  const [items, setItems] = useState<DailyChaosItem[]>([]);
  const [stats, setStats] = useState<DailyChaosStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation & Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyChaosItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDeadline, setFormDeadline] = useState('22:00');
  const [formPriority, setFormPriority] = useState<ChaosPriority>('MEDIUM');
  const [formCategory, setFormCategory] = useState('General');
  const [formTags, setFormTags] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DailyChaosItem | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real chaos records from backend API / database
  const loadChaos = async () => {
    try {
      setErrorMessage(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const url = `/chaos?${params.toString()}`;
      const res = await api.get(url);

      if (res && Array.isArray(res.items)) {
        setItems(res.items);
        if (res.stats) {
          setStats(res.stats);
        }
      } else if (Array.isArray(res)) {
        setItems(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch Daily Chaos records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChaos();
  }, [statusFilter, priorityFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChaos();
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDeadline('22:00');
    setFormPriority('MEDIUM');
    setFormCategory('General');
    setFormTags('');
    setFormError(null);
    setModalVisible(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: DailyChaosItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormDeadline(item.deadline || '');
    setFormPriority(item.priority || 'MEDIUM');
    setFormCategory(item.category || 'General');
    setFormTags(item.tags?.join(', ') || '');
    setFormError(null);
    setModalVisible(true);
  };

  // Save (Create or Update)
  const handleSaveChaos = async () => {
    if (!formTitle.trim()) {
      setFormError(isKn ? 'ದಯವಿಟ್ಟು ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ' : 'Please enter a task title');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingItem) {
        // Update
        await api.patch(`/chaos/${editingItem.id}`, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          date: formDate,
          deadline: formDeadline,
          priority: formPriority,
          category: formCategory,
          tags: parsedTags,
        });
        showToast(isKn ? 'ಕೆಯೋಸ್ ನವೀಕರಿಸಲಾಗಿದೆ! ✓' : 'Chaos entry updated successfully! ✓');
      } else {
        // Create
        await api.post('/chaos', {
          title: formTitle.trim(),
          description: formDescription.trim(),
          date: formDate,
          deadline: formDeadline,
          priority: formPriority,
          category: formCategory,
          tags: parsedTags,
          status: 'PENDING',
        });
        showToast(isKn ? 'ಹೊಸ ಕೆಯೋಸ್ ಸೇರಿಸಲಾಗಿದೆ! 🎉' : 'Daily Chaos created successfully! 🎉');
      }

      setModalVisible(false);
      await loadChaos();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save chaos task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle complete / status
  const handleToggleStatus = async (item: DailyChaosItem) => {
    const nextStatus: ChaosStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.patch(`/chaos/${item.id}`, { status: nextStatus });
      showToast(
        nextStatus === 'COMPLETED'
          ? (isKn ? 'ಅಭಿನಂದನೆಗಳು! ಕೆಯೋಸ್ ಪೂರ್ಣಗೊಂಡಿದೆ! 🎉' : 'Completed! Keep crushing your goals! 🎉')
          : (isKn ? 'ಮರುತೆರೆಯಲಾಗಿದೆ' : 'Reopened task'),
      );
      await loadChaos();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Confirm and Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/chaos/${deleteTarget.id}`);
      showToast(isKn ? 'ತೆಗೆದುಹಾಕಲಾಗಿದೆ' : 'Chaos task deleted');
      setDeleteTarget(null);
      await loadChaos();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete entry', 'error');
    }
  };

  return (
    <MainLayout
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
      }
    >
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Page Header */}
      <PageHeader
        title={isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್' : 'Daily Chaos'}
        subtitle={
          isKn
            ? 'ನಿಮ್ಮ ದೈನಂದಿನ ಸವಾಲುಗಳು ಮತ್ತು ಅನಿರೀಕ್ಷಿತ ಕಾರ್ಯಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ'
            : 'Track, manage, and conquer your unexpected daily tasks and challenges'
        }
        badge={`${stats.pending} pending`}
        actions={
          <PrimaryButton
            title={isKn ? '+ ಹೊಸ ಕೆಯೋಸ್' : '+ Create Chaos'}
            icon="⚡"
            onPress={handleOpenCreateModal}
          />
        }
      />

      {/* Real Statistics Cards */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Total Tasks */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಒಟ್ಟು' : 'Total'}
            </Text>
            <Text style={{ fontSize: 18 }}>📊</Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.total}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ನೋಂದಾಯಿತ ಕಾರ್ಯಗಳು' : 'Recorded entries'}
          </Text>
        </GlassCard>

        {/* Pending */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#FBBF24', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಬಾಕಿ ಇದೆ' : 'Pending'}
            </Text>
            <Text style={{ fontSize: 18 }}>⏳</Text>
          </View>
          <Text style={{ color: '#FBBF24', fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.pending}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ತಕ್ಷಣದ ಗಮನ ಅಗತ್ಯವಿದೆ' : 'Needs attention'}
          </Text>
        </GlassCard>

        {/* In Progress */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಪ್ರಗತಿಯಲ್ಲಿದೆ' : 'In Progress'}
            </Text>
            <Text style={{ fontSize: 18 }}>⚡</Text>
          </View>
          <Text style={{ color: '#38BDF8', fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.inProgress}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ' : 'Currently working'}
          </Text>
        </GlassCard>

        {/* Completed */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed'}
            </Text>
            <Text style={{ fontSize: 18 }}>✓</Text>
          </View>
          <Text style={{ color: '#34D399', fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.completed}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿದಿದೆ' : 'Goals achieved'}
          </Text>
        </GlassCard>
      </View>

      {/* Search & Filter Controls */}
      <GlassCard style={{ padding: 14, marginBottom: 20 }}>
        {/* Search Bar */}
        <InputField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isKn ? 'ಶೀರ್ಷಿಕೆ, ವಿವರ ಅಥವಾ ಟ್ಯಾಗ್‌ಗಳ ಮೂಲಕ ಹುಡುಕಿ...' : 'Search chaos by title, note, or tag...'}
          icon="🔍"
          style={{ marginBottom: 12 }}
        />

        {/* Status Filter Tabs */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {STATUS_FILTERS.map((f) => {
            const isSelected = statusFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setStatusFilter(f.value)}
                style={{
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  borderWidth: 1,
                  borderColor: isSelected ? '#7C3AED' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: DS_TOKENS.radii.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : '#94A3B8',
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Priority Filter Chips */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '800', marginRight: 4 }}>
            {isKn ? 'ಆದ್ಯತೆ:' : 'PRIORITY:'}
          </Text>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPriorityFilter(p)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: DS_TOKENS.radii.pill,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                  borderWidth: 1,
                  borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* Task List / States */}
      {loading ? (
        <LoadingState message={isKn ? 'ಕೆಯೋಸ್ ಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading Daily Chaos records...'} />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={loadChaos} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="⚡"
          title={isKn ? 'ಯಾವುದೇ ಕೆಯೋಸ್ ಸಿಗಲಿಲ್ಲ' : 'No Daily Chaos entries found'}
          description={
            searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? (isKn ? 'ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಕಾರ್ಯಗಳಿಲ್ಲ. ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ.' : 'No tasks match your active filters. Try clearing filters or search.')
              : (isKn ? 'ನಿಮ್ಮ ದಿನವನ್ನು ಆಯೋಜಿಸಲು ಮೊದಲ ಕೆಯೋಸ್ ಸೇರಿಸಿ!' : 'Track unexpected tasks and turn daily chaos into completed wins. Tap "+ Create Chaos" to get started!')
          }
          actionLabel={isKn ? '+ ಹೊಸ ಕೆಯೋಸ್ ಸೇರಿಸಿ' : '+ Create Chaos'}
          onAction={handleOpenCreateModal}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const priorityOpt = PRIORITY_OPTIONS.find((o) => o.value === item.priority) || PRIORITY_OPTIONS[1];

            return (
              <GlassCard
                key={item.id}
                style={{
                  padding: 16,
                  borderColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.3)'
                    : item.priority === 'CRITICAL'
                    ? 'rgba(239, 68, 68, 0.35)'
                    : DS_TOKENS.colors.borderSubtle,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  {/* Status Toggle Checkbox */}
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(item)}
                    activeOpacity={0.8}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      borderWidth: 2,
                      borderColor: isCompleted ? '#10B981' : '#64748B',
                      backgroundColor: isCompleted ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {isCompleted && <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                  </TouchableOpacity>

                  {/* Main Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                      <Text
                        style={{
                          color: isCompleted ? '#64748B' : '#FFFFFF',
                          fontSize: 16,
                          fontWeight: '800',
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                          flex: 1,
                        }}
                      >
                        {item.title}
                      </Text>

                      {/* Priority Badge */}
                      <View
                        style={{
                          backgroundColor: `${priorityOpt.color}22`,
                          borderWidth: 1,
                          borderColor: `${priorityOpt.color}55`,
                          borderRadius: DS_TOKENS.radii.pill,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10 }}>{priorityOpt.emoji}</Text>
                        <Text style={{ color: priorityOpt.color, fontSize: 11, fontWeight: '800' }}>
                          {priorityOpt.label}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    {Boolean(item.description) && (
                      <Text
                        style={{
                          color: '#94A3B8',
                          fontSize: 13,
                          lineHeight: 18,
                          marginBottom: 8,
                        }}
                      >
                        {item.description}
                      </Text>
                    )}

                    {/* Meta Row: Date, Deadline, Category, Tags */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>
                          📅 {item.date}
                        </Text>
                      </View>

                      {Boolean(item.deadline) && (
                        <View
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ color: '#FBBF24', fontSize: 11, fontWeight: '800' }}>
                            ⏰ {item.deadline}
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          backgroundColor: 'rgba(124, 58, 237, 0.15)',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: '#C4B5FD', fontSize: 11, fontWeight: '700' }}>
                          🏷️ {item.category}
                        </Text>
                      </View>

                      {item.tags?.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>
                            #{tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(item)}
                      style={{
                        padding: 6,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(item)}
                      style={{
                        padding: 6,
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* CREATE & EDIT MODAL */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingItem ? (isKn ? 'ಕೆಯೋಸ್ ನವೀಕರಿಸಿ' : 'Edit Daily Chaos') : (isKn ? 'ಹೊಸ ಕೆಯೋಸ್ ರಚಿಸಿ' : 'Create Daily Chaos')}
      >
        <InputField
          label={isKn ? 'ಶೀರ್ಷಿಕೆ (Title) *' : 'Task Title *'}
          value={formTitle}
          onChangeText={setFormTitle}
          placeholder={isKn ? 'ಉದಾ: ಪರೀಕ್ಷೆಗೆ ತಯಾರಿ, ಪ್ರಾಜೆಕ್ಟ್ ಸಲ್ಲಿಕೆ...' : 'e.g. Finish database migration, Fix auth token bug'}
          errorMessage={formError}
        />

        <InputField
          label={isKn ? 'ವಿವರ (Description)' : 'Detailed Description'}
          value={formDescription}
          onChangeText={setFormDescription}
          placeholder={isKn ? 'ಹೆಚ್ಚುವರಿ ವಿವರಣೆ...' : 'Action steps, key notes or context...'}
          multiline
          numberOfLines={3}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InputField
            label={isKn ? 'ದಿನಾಂಕ (Date)' : 'Date'}
            value={formDate}
            onChangeText={setFormDate}
            placeholder="YYYY-MM-DD"
            style={{ flex: 1 }}
          />
          <InputField
            label={isKn ? 'ಗಡುವು (Deadline)' : 'Deadline'}
            value={formDeadline}
            onChangeText={setFormDeadline}
            placeholder="HH:mm (e.g. 18:00)"
            style={{ flex: 1 }}
          />
        </View>

        <Dropdown
          label={isKn ? 'ಆದ್ಯತೆ (Priority)' : 'Priority Level'}
          value={formPriority}
          options={PRIORITY_OPTIONS}
          onSelect={(val) => setFormPriority(val as ChaosPriority)}
        />

        <Dropdown
          label={isKn ? 'ವರ್ಗ (Category)' : 'Category'}
          value={formCategory}
          options={CATEGORY_OPTIONS}
          onSelect={setFormCategory}
        />

        <InputField
          label={isKn ? 'ಟ್ಯಾಗ್‌ಗಳು (Tags - ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ)' : 'Tags (comma separated)'}
          value={formTags}
          onChangeText={setFormTags}
          placeholder="e.g. bug, high-vibe, study"
        />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <SecondaryButton
            title={isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
            onPress={() => setModalVisible(false)}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            title={editingItem ? (isKn ? 'ಉಳಿಸಿ' : 'Save Changes') : (isKn ? 'ರಚಿಸಿ' : 'Create Chaos')}
            onPress={handleSaveChaos}
            loading={formSubmitting}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        visible={Boolean(deleteTarget)}
        title={isKn ? 'ಕೆಯೋಸ್ ತೆಗೆದುಹಾಕಬೇಕೆ?' : 'Delete Chaos Task?'}
        message={
          isKn
            ? `ನೀವು "${deleteTarget?.title}" ಕಾರ್ಯವನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.`
            : `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`
        }
        confirmText={isKn ? 'ತೆಗೆದುಹಾಕಿ' : 'Delete'}
        cancelText={isKn ? 'ರದ್ದು' : 'Cancel'}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </MainLayout>
  );
}
