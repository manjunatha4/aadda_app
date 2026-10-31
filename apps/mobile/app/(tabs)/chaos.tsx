import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { DailyChaosItem, DailyChaosStats, ChaosPriority, ChaosStatus } from '@aadda/shared';
import { SavedFolder, SavedItem } from '../../src/services/clientStore';
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
  { label: 'Medium', value: 'MEDIUM', color: '#0284C7', emoji: '🔵' },
  { label: 'High', value: 'HIGH', color: '#D97706', emoji: '🟡' },
  { label: 'Critical', value: 'CRITICAL', color: '#DC2626', emoji: '🔴' },
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

  // Saved Folders (Reference Image 3)
  const [folders, setFolders] = useState<SavedFolder[]>([
    { id: '1', title: 'Friends', color: '#FFB82E', emoji: '💛', count: 12 },
    { id: '2', title: 'Astronomy', color: '#3C97FF', emoji: '🚀', count: 8 },
    { id: '3', title: 'Tech & Code', color: '#FF7A29', emoji: '💻', count: 15 },
    { id: '4', title: 'Cartoons', color: '#9C75F7', emoji: '🦄', count: 9 },
    { id: '5', title: 'Tasty food', color: '#FF6464', emoji: '🍕', count: 24 },
    { id: '6', title: 'Sport', color: '#31C390', emoji: '⚽', count: 7 },
  ]);
  const [activeFolderModal, setActiveFolderModal] = useState<SavedFolder | null>(null);
  const [folderItems, setFolderItems] = useState<SavedItem[]>([]);
  const [loadingFolderItems, setLoadingFolderItems] = useState(false);
  const [newFolderItemTitle, setNewFolderItemTitle] = useState('');
  const [newFolderItemDesc, setNewFolderItemDesc] = useState('');

  // Daily Chaos Polls (Reference Image 3)
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    poll1_opt1: 58,
    poll1_opt2: 42,
    poll2_opt1: 71,
    poll2_opt2: 29,
  });
  const [userVoted, setUserVoted] = useState<Record<string, string>>({});

  const handleOpenFolder = async (folder: SavedFolder) => {
    setActiveFolderModal(folder);
    setLoadingFolderItems(true);
    try {
      const items = await api.get(`/folders/${folder.id}/items`);
      setFolderItems(Array.isArray(items) ? items : []);
    } catch {
      setFolderItems([]);
    } finally {
      setLoadingFolderItems(false);
    }
  };

  const handleAddFolderItem = async () => {
    if (!activeFolderModal || !newFolderItemTitle.trim()) return;
    try {
      const created = await api.post(`/folders/${activeFolderModal.id}/items`, {
        title: newFolderItemTitle.trim(),
        description: newFolderItemDesc.trim(),
        tag: activeFolderModal.title,
      });
      setFolderItems((prev) => [created, ...prev]);
      setFolders((prev) =>
        prev.map((f) => (f.id === activeFolderModal.id ? { ...f, count: f.count + 1 } : f)),
      );
      setNewFolderItemTitle('');
      setNewFolderItemDesc('');
      showToast('Item saved to folder!');
    } catch {
      showToast('Failed to save item', 'error');
    }
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (userVoted[pollId]) return;
    setUserVoted((prev) => ({ ...prev, [pollId]: optionId }));
    const voteKey = `${pollId}_${optionId}`;
    setPollVotes((prev) => ({
      ...prev,
      [voteKey]: (prev[voteKey] || 0) + 1,
    }));
    showToast('Vote submitted! 🗳️');
  };

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

  // Open modal for new item
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

  // Open modal for editing
  const handleOpenEditModal = (item: DailyChaosItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormDate(item.date);
    setFormDeadline(item.deadline || '');
    setFormPriority(item.priority);
    setFormCategory(item.category || 'General');
    setFormTags(item.tags?.join(', ') || '');
    setFormError(null);
    setModalVisible(true);
  };

  // Save (Create or Update)
  const handleSaveChaos = async () => {
    if (!formTitle.trim()) {
      setFormError(isKn ? 'ದಯವಿಟ್ಟು ಕಾರ್ಯದ ಶೀರ್ಷಿಕೆಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter a task title');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        date: formDate.trim() || new Date().toISOString().split('T')[0],
        deadline: formDeadline.trim() || undefined,
        priority: formPriority,
        category: formCategory,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingItem) {
        await api.patch(`/chaos/${editingItem.id}`, payload);
        showToast(isKn ? 'ಕೆಯೋಸ್ ನವೀಕರಿಸಲಾಗಿದೆ! ⚡' : 'Daily Chaos updated successfully! ⚡');
      } else {
        await api.post('/chaos', payload);
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
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DS_TOKENS.colors.purple} />
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

      {/* Saved Folders Section - Exactly as shown in Reference Image 3 */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '900' }}>
              {isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved'}
            </Text>
            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderColor: '#E2E8F0',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#475569', fontSize: 12, fontWeight: '800' }}>
                {folders.length} {isKn ? 'ಫೋಲ್ಡರ್‌ಗಳು +' : 'folders +'}
              </Text>
            </View>
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#A7F3D0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>🐸</Text>
          </View>
        </View>

        {/* 2-Column Folders Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {folders.map((f) => (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.85}
              onPress={() => handleOpenFolder(f)}
              style={{
                flex: 1,
                minWidth: '46%',
                borderRadius: 20,
                backgroundColor: f.color,
                padding: 16,
                minHeight: 110,
                justifyContent: 'space-between',
                shadowColor: f.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>
                    {f.count} items
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 12 }}>
                {f.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Chaos Polls Section - Exactly as shown in Reference Image 3 */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 19, fontWeight: '900' }}>
              {isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್ ಪೋಲ್‌ಗಳು' : 'Daily Chaos Polls'}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#FDE68A',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '800' }}>2 active</Text>
          </View>
        </View>

        {/* Featured Poll Card 1 */}
        <GlassCard style={{ padding: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: '#ECFDF5',
                borderColor: '#A7F3D0',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#047857', fontSize: 11, fontWeight: '900' }}>
                CHAOS 🔥 MOST_LIKELY_TO
              </Text>
            </View>
            <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
              Active Round
            </Text>
          </View>

          <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 17, fontWeight: '900', lineHeight: 24, marginBottom: 16 }}>
            {isKn
              ? 'ರಾತ್ರಿ 2 ಗಂಟೆಗೆ ಸ್ವಿಗ್ಗಿ ಆರ್ಡರ್ ಮಾಡಿ ಅದು ಬರುವ ಮುನ್ನವೇ ನಿದ್ದೆ ಮಾಡುವ ಸಾಧ್ಯತೆ ಯಾರಿಗಿದೆ?'
              : 'Most likely to order Swiggy at 2 AM and sleep before it arrives'}
          </Text>

          {/* Interactive Voting Options */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => handleVote('poll1', 'opt1')}
              activeOpacity={0.8}
              style={{
                borderWidth: 1.5,
                borderColor: userVoted['poll1'] === 'opt1' ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                backgroundColor: userVoted['poll1'] === 'opt1' ? DS_TOKENS.colors.purpleLight : DS_TOKENS.colors.bgSecondary,
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                🍕 {isKn ? 'ನಾನು (100% ಅಪರಾಧಿ)' : 'Me (100% guilty)'}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 13, fontWeight: '900' }}>
                {Math.round((pollVotes.poll1_opt1 / (pollVotes.poll1_opt1 + pollVotes.poll1_opt2)) * 100)}% ({pollVotes.poll1_opt1})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleVote('poll1', 'opt2')}
              activeOpacity={0.8}
              style={{
                borderWidth: 1.5,
                borderColor: userVoted['poll1'] === 'opt2' ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                backgroundColor: userVoted['poll1'] === 'opt2' ? DS_TOKENS.colors.purpleLight : DS_TOKENS.colors.bgSecondary,
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                😂 {isKn ? 'ನನ್ನ ಬೆಸ್ಟ್ ಫ್ರೆಂಡ್' : 'My best friend'}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 13, fontWeight: '900' }}>
                {Math.round((pollVotes.poll1_opt2 / (pollVotes.poll1_opt1 + pollVotes.poll1_opt2)) * 100)}% ({pollVotes.poll1_opt2})
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>

      {/* Tasks Section Header */}
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 19, fontWeight: '900' }}>
          ⚡ {isKn ? 'ದೈನಂದಿನ ಕಾರ್ಯಗಳು ಮತ್ತು ಸವಾಲುಗಳು' : 'Daily Tasks & Trackers'}
        </Text>
      </View>

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
          <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.total}
          </Text>
          <Text style={{ color: DS_TOKENS.colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ನೋಂದಾಯಿತ ಕಾರ್ಯಗಳು' : 'Recorded entries'}
          </Text>
        </GlassCard>

        {/* Pending */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: DS_TOKENS.colors.amberBorder, backgroundColor: DS_TOKENS.colors.amberLight }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: DS_TOKENS.colors.amber, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಬಾಕಿ ಇದೆ' : 'Pending'}
            </Text>
            <Text style={{ fontSize: 18 }}>⏳</Text>
          </View>
          <Text style={{ color: DS_TOKENS.colors.amber, fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.pending}
          </Text>
          <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ತಕ್ಷಣದ ಗಮನ ಅಗತ್ಯವಿದೆ' : 'Needs attention'}
          </Text>
        </GlassCard>

        {/* In Progress */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: DS_TOKENS.colors.skyBorder, backgroundColor: DS_TOKENS.colors.skyLight }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: DS_TOKENS.colors.sky, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಪ್ರಗತಿಯಲ್ಲಿದೆ' : 'In Progress'}
            </Text>
            <Text style={{ fontSize: 18 }}>⚡</Text>
          </View>
          <Text style={{ color: DS_TOKENS.colors.sky, fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.inProgress}
          </Text>
          <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {isKn ? 'ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ' : 'Currently working'}
          </Text>
        </GlassCard>

        {/* Completed */}
        <GlassCard style={{ flex: 1, minWidth: 140, padding: 16, borderColor: DS_TOKENS.colors.emeraldBorder, backgroundColor: DS_TOKENS.colors.emeraldLight }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: DS_TOKENS.colors.emerald, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed'}
            </Text>
            <Text style={{ fontSize: 18 }}>✓</Text>
          </View>
          <Text style={{ color: DS_TOKENS.colors.emerald, fontSize: 28, fontWeight: '900', marginTop: 8 }}>
            {stats.completed}
          </Text>
          <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
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
                  backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : DS_TOKENS.colors.bgSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.borderSubtle,
                  borderRadius: DS_TOKENS.radii.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
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
          <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '800', marginRight: 4 }}>
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
                  backgroundColor: isSelected ? DS_TOKENS.colors.purpleLight : 'transparent',
                  borderWidth: 1,
                  borderColor: isSelected ? DS_TOKENS.colors.purpleBorder : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: isSelected ? DS_TOKENS.colors.purple : DS_TOKENS.colors.textSecondary,
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
                    ? DS_TOKENS.colors.emeraldBorder
                    : item.priority === 'CRITICAL'
                    ? DS_TOKENS.colors.roseBorder
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
                      borderColor: isCompleted ? DS_TOKENS.colors.emerald : '#CBD5E1',
                      backgroundColor: isCompleted ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.bgSecondary,
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
                          color: isCompleted ? DS_TOKENS.colors.textMuted : DS_TOKENS.colors.textPrimary,
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
                          backgroundColor: `${priorityOpt.color}15`,
                          borderWidth: 1,
                          borderColor: `${priorityOpt.color}40`,
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
                          color: DS_TOKENS.colors.textSecondary,
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
                          backgroundColor: DS_TOKENS.colors.bgSecondary,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: DS_TOKENS.colors.borderSubtle,
                        }}
                      >
                        <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                          📅 {item.date}
                        </Text>
                      </View>

                      {Boolean(item.deadline) && (
                        <View
                          style={{
                            backgroundColor: DS_TOKENS.colors.amberLight,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderWidth: 1,
                            borderColor: DS_TOKENS.colors.amberBorder,
                          }}
                        >
                          <Text style={{ color: DS_TOKENS.colors.amber, fontSize: 11, fontWeight: '800' }}>
                            ⏰ {item.deadline}
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          backgroundColor: DS_TOKENS.colors.purpleLight,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: DS_TOKENS.colors.purpleBorder,
                        }}
                      >
                        <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 11, fontWeight: '700' }}>
                          🏷️ {item.category}
                        </Text>
                      </View>

                      {item.tags?.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            backgroundColor: DS_TOKENS.colors.bgSecondary,
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderWidth: 1,
                            borderColor: DS_TOKENS.colors.borderSubtle,
                          }}
                        >
                          <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
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
                        backgroundColor: DS_TOKENS.colors.bgSecondary,
                        borderWidth: 1,
                        borderColor: DS_TOKENS.colors.borderSubtle,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(item)}
                      style={{
                        padding: 6,
                        backgroundColor: DS_TOKENS.colors.roseLight,
                        borderWidth: 1,
                        borderColor: DS_TOKENS.colors.roseBorder,
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

      {/* FOLDER ITEMS MODAL */}
      <Modal
        visible={Boolean(activeFolderModal)}
        onClose={() => setActiveFolderModal(null)}
        title={`${activeFolderModal?.emoji || '📁'} ${activeFolderModal?.title || 'Folder'}`}
      >
        <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 14 }}>
          {isKn ? 'ಈ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾದ ಐಟಂಗಳು' : 'Saved notes, hangouts, and highlights in this folder'}
        </Text>

        {/* Add item to folder input */}
        <View style={{ marginBottom: 16 }}>
          <InputField
            value={newFolderItemTitle}
            onChangeText={setNewFolderItemTitle}
            placeholder={isKn ? '+ ಹೊಸ ಐಟಂ ಶೀರ್ಷಿಕೆ' : '+ New item title'}
            style={{ marginBottom: 8 }}
          />
          <InputField
            value={newFolderItemDesc}
            onChangeText={setNewFolderItemDesc}
            placeholder={isKn ? 'ಟಿಪ್ಪಣಿ ಅಥವಾ ವಿವರ (ಐಚ್ಛಿಕ)' : 'Note or details (optional)'}
            style={{ marginBottom: 8 }}
          />
          <PrimaryButton
            title={isKn ? 'ಫೋಲ್ಡರ್‌ಗೆ ಸೇರಿಸಿ' : 'Add to Folder'}
            onPress={handleAddFolderItem}
            disabled={!newFolderItemTitle.trim()}
          />
        </View>

        {/* Items List */}
        {loadingFolderItems ? (
          <LoadingState message="Loading saved items..." />
        ) : folderItems.length === 0 ? (
          <EmptyState
            icon="📂"
            title={isKn ? 'ಯಾವುದೇ ಐಟಂ ಉಳಿಸಿಲ್ಲ' : 'No items saved yet'}
            description={isKn ? 'ಮೇಲಿನ ಫಾರ್ಮ್ ಬಳಸಿ ಮೊದಲ ಐಟಂ ಸೇರಿಸಿ!' : 'Add your first note or link above!'}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {folderItems.map((item) => (
              <GlassCard key={item.id} style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                    {item.title}
                  </Text>
                  {Boolean(item.tag) && (
                    <View
                      style={{
                        backgroundColor: DS_TOKENS.colors.purpleLight,
                        borderColor: DS_TOKENS.colors.purpleBorder,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 10, fontWeight: '800' }}>
                        {item.tag}
                      </Text>
                    </View>
                  )}
                </View>
                {Boolean(item.description) && (
                  <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 4 }}>
                    {item.description}
                  </Text>
                )}
                {Boolean(item.date) && (
                  <Text style={{ color: DS_TOKENS.colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 4 }}>
                    🕒 {item.date}
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <SecondaryButton
            title={isKn ? 'ಮುಚ್ಚಿ' : 'Close'}
            onPress={() => setActiveFolderModal(null)}
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
