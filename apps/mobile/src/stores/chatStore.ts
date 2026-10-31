import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    sender: { displayName: string };
  } | null;
  reactions?: { id: string; emoji: string; userId: string }[];
  createdAt: string;
}

interface ChatState {
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, string[]>; // conversationId -> array of usernames
  setActiveConversation: (conversationId: string | null) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setUserTyping: (conversationId: string, username: string, isTyping: boolean) => void;
  updateReaction: (conversationId: string, messageId: string, reaction: any) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  messages: {},
  typingUsers: {},

  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const convMessages = state.messages[message.conversationId] || [];
      // Prevent duplicates
      if (convMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [message, ...convMessages],
        },
      };
    }),

  setUserTyping: (conversationId, username, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),

  updateReaction: (conversationId, messageId, reactionData) =>
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      const updated = convMessages.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || [];
        if (reactionData.action === 'removed') {
          return {
            ...msg,
            reactions: currentReactions.filter(
              (r) => !(r.emoji === reactionData.emoji && r.userId === reactionData.userId),
            ),
          };
        } else if (reactionData.action === 'added') {
          return {
            ...msg,
            reactions: [...currentReactions, reactionData.reaction],
          };
        }
        return msg;
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: updated,
        },
      };
    }),
}));

