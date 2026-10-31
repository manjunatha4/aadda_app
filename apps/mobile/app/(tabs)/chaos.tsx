import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { SavedFolder, SavedItem } from '../../src/services/clientStore';
import { ChaosCard } from '../../src/components/ChaosCard';
import { Floating } from '../../src/components/AnimatedVisuals';

const SAMPLE_CHALLENGES = [
  {
    id: 'ch-1',
    promptText: 'Most likely to order Swiggy at 2 AM and sleep before it arrives',
    promptTextKn: 'ರಾತ್ರಿ 2 ಗಂಟೆಗೆ ಸ್ವಿಗ್ಗಿ ಆರ್ಡರ್ ಮಾಡಿ ಡೆಲಿವರಿ ಬರೋ ಮುಂಚೆ ನಿದ್ರೆ ಹೋಗುವವರು ಯಾರು?',
    category: 'MOST_LIKELY_TO',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    entries: [
      { id: 'e1', content: 'Alex 100% does this every weekend', voteCount: 14, user: { displayName: 'Kavya' } },
      { id: 'e2', content: 'Me tbh, happened yesterday 😂', voteCount: 9, user: { displayName: 'Alex' } },
    ],
  },
  {
    id: 'ch-2',
    promptText: 'Describe your best friend using only ONE dramatic word',
    promptTextKn: 'ನಿಮ್ಮ ಬೆಸ್ಟ್ ಫ್ರೆಂಡ್‌ನ ಒಂದೇ ನಾಟಕೀಯ ಪದದಲ್ಲಿ ವಿವರಿಸಿ',
    category: 'ONE_WORD_ROAST',
    expiresAt: new Date(Date.now() + 172800000).toISOString(),
    entries: [
      { id: 'e3', content: 'Unpredictable 🌪️', voteCount: 18, user: { displayName: 'Rahul' } },
      { id: 'e4', content: 'Drama-Queen 💅', voteCount: 12, user: { displayName: 'Pooja' } },
    ],
  },
];

const FOLDER_COLORS = ['#FFB82E', '#3C97FF', '#FF7A29', '#9C75F7', '#FF6464', '#31C390', '#EC4899', '#8B5CF6'];
const FOLDER_EMOJIS = ['📁', '💛', '🚀', '💻', '🦄', '🍕', '⚽', '🎵', '📚', '🎮', '✈️', '🎬', '💡'];

export default function ChaosScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [folders, setFolders] = useState<SavedFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<SavedFolder | null>(null);
  const [folderItems, setFolderItems] = useState<SavedItem[]>([]);
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<SavedItem | null>(null);

  // New Folder Modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('#FFB82E');

  // Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemTag, setNewItemTag] = useState('');

  const [challenges, setChallenges] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isKn = i18n.language === 'kn';

  const loadData = async () => {
    try {
      const fList = await api.get('/folders').catch(() => []);
      if (Array.isArray(fList) && fList.length > 0) {
        setFolders(fList);
      }

      const addas = await api.get('/addas').catch(() => []);
      const allChallenges: any[] = [];
      for (const a of addas) {
        const cList = await api.get(`/chaos/adda/${a.id}`).catch(() => []);
        allChallenges.push(...cList);
      }
      setChallenges(allChallenges.length > 0 ? allChallenges : SAMPLE_CHALLENGES);
    } catch {
      setChallenges(SAMPLE_CHALLENGES);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedFolder) {
      await openFolder(selectedFolder);
    }
    setRefreshing(false);
  };

  // Open folder detail view
  const openFolder = async (folder: SavedFolder) => {
    setSelectedFolder(folder);
    try {
      const items = await api.get(`/folders/${folder.id}/items`).catch(() => []);
      setFolderItems(Array.isArray(items) ? items : []);
    } catch {
      setFolderItems([]);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderTitle.trim()) return;
    try {
      const created = await api.post('/folders', {
        title: newFolderTitle.trim(),
        emoji: newFolderEmoji,
        color: newFolderColor,
      });
      setFolders((prev) => [...prev, created]);
      setNewFolderTitle('');
      setShowNewFolderModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create folder');
    }
  };

  // Add new item inside folder
  const handleAddItem = async () => {
    if (!selectedFolder || !newItemTitle.trim()) return;
    try {
      const createdItem = await api.post(`/folders/${selectedFolder.id}/items`, {
        title: newItemTitle.trim(),
        description: newItemDescription.trim(),
        tag: newItemTag.trim() || 'General',
      });

      setFolderItems((prev) => [createdItem, ...prev]);

      // Update folder count locally
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id ? { ...f, count: (f.count || 0) + 1 } : f,
        ),
      );
      setSelectedFolder((prev) => (prev ? { ...prev, count: (prev.count || 0) + 1 } : null));

      setNewItemTitle('');
      setNewItemDescription('');
      setNewItemTag('');
      setShowAddItemModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add item');
    }
  };

  const handleVote = async (entryId: string) => {
    try {
      await api.post(`/chaos/vote/${entryId}`).catch(() => {});
      setChallenges((prev) =>
        prev.map((c) => ({
          ...c,
          entries: c.entries?.map((e: any) =>
            e.id === entryId ? { ...e, voteCount: e.voteCount + 1 } : e,
          ),
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = folderItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchItemQuery.toLowerCase()),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F5F2EB' }}
      contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFB82E" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. DEDICATED FOLDER DETAIL VIEW */}
      {/* ------------------------------------------------------------- */}
      {selectedFolder ? (
        <View>
          {/* Back button & Folder Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setSelectedFolder(null)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            >
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900', marginRight: 4 }}>‹</Text>
              <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800' }}>
                {isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Back to Saved'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddItemModal(true)}
              activeOpacity={0.85}
              style={{
                backgroundColor: selectedFolder.color,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 8,
                shadowColor: selectedFolder.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                + {isKn ? 'ಐಟಂ ಸೇರಿಸಿ' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Folder Hero Banner */}
          <View
            style={{
              backgroundColor: selectedFolder.color,
              borderRadius: 26,
              padding: 20,
              marginBottom: 16,
              shadowColor: selectedFolder.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 36, marginRight: 12 }}>{selectedFolder.emoji}</Text>
                <View>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 }}>
                    {selectedFolder.title}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' }}>
                    {folderItems.length} {isKn ? 'ಐಟಂಗಳು' : 'saved items'}
                  </Text>
                </View>
              </View>

              <Floating distance={4} duration={2200}>
                <Text style={{ fontSize: 24 }}>✨</Text>
              </Floating>
            </View>
          </View>

          {/* Search inside folder */}
          {folderItems.length > 0 && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 9,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            >
              <Text style={{ marginRight: 8, fontSize: 14 }}>🔍</Text>
              <TextInput
                value={searchItemQuery}
                onChangeText={setSearchItemQuery}
                placeholder={isKn ? 'ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಹುಡುಕಿ...' : 'Search in this folder...'}
                placeholderTextColor="#A8A29E"
                style={{ flex: 1, fontSize: 14, color: '#18171C', fontWeight: '600' }}
              />
              {Boolean(searchItemQuery) && (
                <TouchableOpacity onPress={() => setSearchItemQuery('')}>
                  <Text style={{ color: '#A8A29E', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Folder Items List */}
          {filteredItems.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 30,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            >
              <Text style={{ fontSize: 44, marginBottom: 10 }}>📭</Text>
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                {isKn ? 'ಯಾವುದೇ ಐಟಂ ಉಳಿಸಲಾಗಿಲ್ಲ' : 'No items in this folder yet'}
              </Text>
              <Text style={{ color: '#78716C', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                {isKn
                  ? 'ಮೇಲಿನ "+ ಐಟಂ ಸೇರಿಸಿ" ಬಟನ್ ಒತ್ತಿ ಹೊಸ ನೋಟ್ ಅಥವಾ ಲಿಂಕ್ ಸೇರಿಸಿ'
                  : 'Tap "+ Add Item" above to save your first note, quote, or link here!'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddItemModal(true)}
                style={{
                  backgroundColor: selectedFolder.color,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                  + {isKn ? 'ಮೊದಲ ಐಟಂ ಸೇರಿಸಿ' : 'Save First Item'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedItemDetail(item)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#E8E5DD',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#18171C', fontSize: 16, fontWeight: '900', flex: 1, marginRight: 8 }}>
                    {item.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#F5F2EB',
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: '#78716C', fontSize: 11, fontWeight: '800' }}>
                      {item.tag}
                    </Text>
                  </View>
                </View>

                {Boolean(item.description) && (
                  <Text numberOfLines={2} style={{ color: '#57534E', fontSize: 13, lineHeight: 18, marginBottom: 8 }}>
                    {item.description}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#A8A29E', fontSize: 11, fontWeight: '700' }}>
                    📅 {item.date}
                  </Text>
                  <Text style={{ color: selectedFolder.color, fontSize: 12, fontWeight: '800' }}>
                    {isKn ? 'ವಿವರ ನೋಡಿ ›' : 'View details ›'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. MAIN FOLDERS GRID & DAILY CHAOS POLLS */
        /* ------------------------------------------------------------- */
        <View>
          {/* Header matching reference Screen 2 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#18171C', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
                {isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved'}
              </Text>

              {/* Functional "folders +" button */}
              <TouchableOpacity
                onPress={() => setShowNewFolderModal(true)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#E6E1D4',
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginLeft: 10,
                }}
              >
                <Text style={{ color: '#686055', fontSize: 13, fontWeight: '700' }}>
                  {folders.length} {isKn ? 'ಫೋಲ್ಡರ್‌ಗಳು' : 'folders'} +
                </Text>
              </TouchableOpacity>
            </View>

            <Floating distance={4} duration={2400}>
              <Text style={{ fontSize: 26 }}>🐸</Text>
            </Floating>
          </View>

          {/* Colorful Folder Cards Grid - Fully Clickable */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                onPress={() => openFolder(folder)}
                activeOpacity={0.85}
                style={{
                  width: '48%',
                  backgroundColor: folder.color,
                  borderRadius: 22,
                  padding: 14,
                  marginBottom: 12,
                  shadowColor: folder.color,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 3,
                  borderTopLeftRadius: 10, // Playful folder tab shape
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 22 }}>{folder.emoji}</Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 10,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                      {folder.count} items
                    </Text>
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '900',
                    letterSpacing: -0.2,
                  }}
                >
                  {folder.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Daily Chaos / Burning Polls Section */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#18171C', fontSize: 20, fontWeight: '900' }}>
              🔥 {isKn ? 'ಕೇಯಾಸ್ ಪೋಲ್‌ಗಳು' : 'Daily Chaos Polls'}
            </Text>
            <Text style={{ color: '#78716C', fontSize: 12, fontWeight: '700' }}>
              {challenges.length} active
            </Text>
          </View>

          {challenges.map((c) => (
            <ChaosCard
              key={c.id}
              id={c.id}
              promptText={isKn && c.promptTextKn ? c.promptTextKn : c.promptText}
              category={c.category}
              expiresAt={c.expiresAt}
              entries={c.entries || []}
              onVote={handleVote}
              onSubmitEntry={(text) => {}}
            />
          ))}
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: CREATE NEW FOLDER */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={showNewFolderModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 22,
              maxWidth: 440,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                📁 {isKn ? 'ಹೊಸ ಫೋಲ್ಡರ್ ರಚಿಸಿ' : 'Create New Folder'}
              </Text>
              <TouchableOpacity onPress={() => setShowNewFolderModal(false)}>
                <Text style={{ color: '#78716C', fontWeight: '900', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ಫೋಲ್ಡರ್ ಹೆಸರು' : 'Folder Name'}
            </Text>
            <TextInput
              value={newFolderTitle}
              onChangeText={setNewFolderTitle}
              placeholder="e.g. Travel, Gym, Movies"
              placeholderTextColor="#A8A29E"
              style={{
                backgroundColor: '#F5F2EB',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#18171C',
                fontSize: 15,
                fontWeight: '700',
                marginBottom: 14,
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            />

            {/* Emoji Selection */}
            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ಐಕಾನ್ ಆಯ್ಕೆಮಾಡಿ' : 'Select Icon'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 14 }}>
              {FOLDER_EMOJIS.map((em) => (
                <TouchableOpacity
                  key={em}
                  onPress={() => setNewFolderEmoji(em)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: newFolderEmoji === em ? '#E6E1D4' : '#F5F2EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    borderWidth: 1.5,
                    borderColor: newFolderEmoji === em ? '#7047EB' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color Selection */}
            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ಬಣ್ಣ ಆಯ್ಕೆಮಾಡಿ' : 'Select Color'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {FOLDER_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setNewFolderColor(col)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: col,
                    borderWidth: 2.5,
                    borderColor: newFolderColor === col ? '#18171C' : '#FFFFFF',
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleCreateFolder}
              disabled={!newFolderTitle.trim()}
              style={{
                backgroundColor: newFolderColor,
                borderRadius: 18,
                paddingVertical: 13,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                {isKn ? 'ಫೋಲ್ಡರ್ ಸೇರಿಸಿ' : 'Create Folder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: ADD ITEM INSIDE FOLDER */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={showAddItemModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 22,
              maxWidth: 440,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#18171C', fontSize: 18, fontWeight: '900' }}>
                ✍️ {isKn ? 'ಐಟಂ ಉಳಿಸಿ' : `Save Item to ${selectedFolder?.title}`}
              </Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Text style={{ color: '#78716C', fontWeight: '900', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ಶೀರ್ಷಿಕೆ (Title) *' : 'Title *'}
            </Text>
            <TextInput
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              placeholder="e.g. Favorite Quote, Project Link, Idea"
              placeholderTextColor="#A8A29E"
              style={{
                backgroundColor: '#F5F2EB',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#18171C',
                fontSize: 15,
                fontWeight: '700',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            />

            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ಟ್ಯಾಗ್ / ವರ್ಗ (Tag)' : 'Tag / Category'}
            </Text>
            <TextInput
              value={newItemTag}
              onChangeText={setNewItemTag}
              placeholder="e.g. Quote, Music, Note, Work"
              placeholderTextColor="#A8A29E"
              style={{
                backgroundColor: '#F5F2EB',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#18171C',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            />

            <Text style={{ color: '#18171C', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
              {isKn ? 'ವಿವರಣೆ / ಲಿಂಕ್ / ನೋಟ್' : 'Description / Notes'}
            </Text>
            <TextInput
              value={newItemDescription}
              onChangeText={setNewItemDescription}
              placeholder="Type your saved notes, links, or text here..."
              placeholderTextColor="#A8A29E"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: '#F5F2EB',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#18171C',
                fontSize: 14,
                height: 80,
                textAlignVertical: 'top',
                marginBottom: 18,
                borderWidth: 1,
                borderColor: '#E8E5DD',
              }}
            />

            <TouchableOpacity
              onPress={handleAddItem}
              disabled={!newItemTitle.trim()}
              style={{
                backgroundColor: selectedFolder?.color || '#FFB82E',
                borderRadius: 18,
                paddingVertical: 13,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                {isKn ? 'ಉಳಿಸಿ' : 'Save Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: VIEW ITEM DETAILS */}
      {/* ------------------------------------------------------------- */}
      <Modal visible={Boolean(selectedItemDetail)} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 22,
              maxWidth: 440,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: '#F5F2EB',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: '#78716C', fontSize: 12, fontWeight: '800' }}>
                  {selectedItemDetail?.tag}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedItemDetail(null)}>
                <Text style={{ color: '#78716C', fontWeight: '900', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#18171C', fontSize: 20, fontWeight: '900', marginBottom: 8 }}>
              {selectedItemDetail?.title}
            </Text>

            <Text style={{ color: '#57534E', fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
              {selectedItemDetail?.description || 'No additional description provided.'}
            </Text>

            <Text style={{ color: '#A8A29E', fontSize: 11, fontWeight: '700', marginBottom: 16 }}>
              📅 Saved on {selectedItemDetail?.date}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedItemDetail(null)}
              style={{
                backgroundColor: '#18171C',
                borderRadius: 16,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                {isKn ? 'ಮುಚ್ಚಿ' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
