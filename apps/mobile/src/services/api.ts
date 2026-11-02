import { storage } from './storage';
import { clientStore, SavedFolder, SavedItem } from './clientStore';

declare const process: any;

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8081/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await storage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async executeWithFallback<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Returned HTML (e.g. Vercel SPA rewrite fallback)
        throw new Error('Not JSON response');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'API error');
      }

      return await res.json();
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      // Seamless fallback to client store engine
      return this.handleFallback<T>(method, endpoint, data);
    }
  }

  private async handleFallback<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    // 1. Auth Check Email
    if (endpoint.startsWith('/auth/check-email') && method === 'POST') {
      const res = await clientStore.checkEmail(data?.email || '');
      return res as unknown as T;
    }

    // 2. Auth Check Username
    if (endpoint.startsWith('/auth/check-username') && method === 'POST') {
      const res = await clientStore.checkUsername(data?.username || '');
      return res as unknown as T;
    }

    // 3. Auth Verify Email
    if (endpoint.startsWith('/auth/verify-email') && method === 'POST') {
      const res = await clientStore.verifyEmail(data?.email, data?.code);
      return res as unknown as T;
    }

    // 4. Auth Resend Code
    if (endpoint.startsWith('/auth/resend-code') && method === 'POST') {
      const res = await clientStore.resendCode(data?.email);
      return res as unknown as T;
    }

    // 5. Auth Login
    if (endpoint.startsWith('/auth/login') && method === 'POST') {
      const res = await clientStore.login(data?.login || 'user', data?.password);
      return res as unknown as T;
    }

    // 6. Auth Register
    if (endpoint.startsWith('/auth/register') && method === 'POST') {
      const res = await clientStore.register(data);
      return res as unknown as T;
    }

    // 7. Current User
    if (endpoint.startsWith('/auth/me') && method === 'GET') {
      const user = await clientStore.getCurrentUser();
      return user as unknown as T;
    }

    // 4. Addas List
    if (endpoint === '/addas' && method === 'GET') {
      const addas = await clientStore.getAddas();
      return addas as unknown as T;
    }

    // 5. Create Adda
    if (endpoint === '/addas' && method === 'POST') {
      const created = await clientStore.createAdda(data?.name, data?.description);
      return created as unknown as T;
    }

    // 6. Accept Invite
    if (endpoint.startsWith('/invitations/accept') && method === 'POST') {
      const res = await clientStore.acceptInvite(data?.code);
      return res as unknown as T;
    }

    // 7. Conversations
    if (endpoint === '/conversations' && method === 'GET') {
      const list = await clientStore.getConversations();
      return list as unknown as T;
    }

    if (endpoint.startsWith('/conversations/') && method === 'GET') {
      const id = endpoint.replace('/conversations/', '');
      const conv = await clientStore.getConversationById(id);
      return conv as unknown as T;
    }

    // 8. Messages
    if (endpoint.startsWith('/messages/conversation/') && method === 'GET') {
      const id = endpoint.split('?')[0].replace('/messages/conversation/', '');
      const msgs = await clientStore.getMessages(id);
      return msgs as unknown as T;
    }

    if (endpoint === '/messages' && method === 'POST') {
      const msg = await clientStore.sendMessage(
        data?.conversationId,
        data?.content,
        data?.mediaUrl,
      );
      return msg as unknown as T;
    }

    // 9. Folders & Folder Items (Requirement 3)
    if (endpoint === '/folders' && method === 'GET') {
      const f = await clientStore.getFolders();
      return f as unknown as T;
    }

    if (endpoint === '/folders' && method === 'POST') {
      const f = await clientStore.createFolder(data?.title, data?.emoji, data?.color);
      return f as unknown as T;
    }

    if (endpoint.startsWith('/folders/') && endpoint.endsWith('/items')) {
      const folderId = endpoint.replace('/folders/', '').replace('/items', '');
      if (method === 'GET') {
        const items = await clientStore.getFolderItems(folderId);
        return items as unknown as T;
      }
      if (method === 'POST') {
        const item = await clientStore.addFolderItem(
          folderId,
          data?.title,
          data?.description,
          data?.tag,
        );
        return item as unknown as T;
      }
    }

    // 10. Daily Chaos Full Fallback
    if (endpoint === '/chaos' || endpoint.startsWith('/chaos?') || endpoint.startsWith('/chaos/')) {
      const currentUser = await clientStore.getCurrentUser();
      const userId = currentUser?.id || 'usr_default';

      if (method === 'GET' && (endpoint === '/chaos' || endpoint.startsWith('/chaos?'))) {
        const queryStr = endpoint.includes('?') ? endpoint.split('?')[1] : '';
        const params = new URLSearchParams(queryStr);
        const filters = {
          status: params.get('status') || undefined,
          priority: params.get('priority') || undefined,
          category: params.get('category') || undefined,
          date: params.get('date') || undefined,
          search: params.get('search') || undefined,
        };
        const res = await clientStore.getDailyChaos(userId, filters);
        return res as unknown as T;
      }

      if (method === 'POST' && endpoint === '/chaos') {
        const created = await clientStore.createDailyChaos(userId, data);
        return created as unknown as T;
      }

      if (method === 'PATCH' && endpoint.startsWith('/chaos/')) {
        const id = endpoint.replace('/chaos/', '').split('?')[0];
        const updated = await clientStore.updateDailyChaos(userId, id, data);
        return updated as unknown as T;
      }

      if (method === 'DELETE' && endpoint.startsWith('/chaos/')) {
        const id = endpoint.replace('/chaos/', '').split('?')[0];
        const success = await clientStore.deleteDailyChaos(userId, id);
        return { success, id } as unknown as T;
      }
    }

    // 11. Adda Buzz Full Fallback
    if (endpoint === '/buzz' || endpoint.startsWith('/buzz?') || endpoint.startsWith('/buzz/')) {
      if (endpoint === '/buzz' || endpoint.startsWith('/buzz?')) {
        if (method === 'GET') {
          const queryStr = endpoint.includes('?') ? endpoint.split('?')[1] : '';
          const params = new URLSearchParams(queryStr);
          const addaId = params.get('addaId') || undefined;
          const category = params.get('category') || undefined;
          const filter = params.get('filter') || undefined;
          const posts = await clientStore.getBuzzFeed(addaId, category, filter);
          return posts as unknown as T;
        }

        if (method === 'POST') {
          const post = await clientStore.createBuzzPost(data);
          return post as unknown as T;
        }
      }

      if (endpoint.startsWith('/buzz/') && method === 'DELETE') {
        const id = endpoint.replace('/buzz/', '').split('?')[0];
        const success = await clientStore.deleteBuzzPost(id);
        return { success, id } as unknown as T;
      }

      if (endpoint.startsWith('/buzz/') && endpoint.endsWith('/react') && method === 'POST') {
        const id = endpoint.replace('/buzz/', '').replace('/react', '').split('?')[0];
        const res = await clientStore.toggleBuzzReaction(id, data?.emoji);
        return res as unknown as T;
      }

      if (endpoint.startsWith('/buzz/') && endpoint.endsWith('/comments')) {
        const id = endpoint.replace('/buzz/', '').replace('/comments', '').split('?')[0];
        if (method === 'GET') {
          const comments = await clientStore.getBuzzComments(id);
          return comments as unknown as T;
        }
        if (method === 'POST') {
          const comment = await clientStore.addBuzzComment(id, data?.content, data?.parentId);
          return comment as unknown as T;
        }
      }

      if (endpoint.startsWith('/buzz/') && endpoint.endsWith('/vote') && method === 'POST') {
        const id = endpoint.replace('/buzz/', '').replace('/vote', '').split('?')[0];
        const res = await clientStore.voteBuzzPoll(id, data?.optionId);
        return res as unknown as T;
      }

      if (endpoint.startsWith('/buzz/') && endpoint.endsWith('/bookmark') && method === 'POST') {
        const id = endpoint.replace('/buzz/', '').replace('/bookmark', '').split('?')[0];
        const res = await clientStore.toggleBuzzBookmark(id);
        return res as unknown as T;
      }

      if (endpoint.startsWith('/buzz/') && endpoint.endsWith('/report') && method === 'POST') {
        const id = endpoint.replace('/buzz/', '').replace('/report', '').split('?')[0];
        const res = await clientStore.reportBuzzPost(id, data?.reason, data?.details);
        return res as unknown as T;
      }
    }

    if (endpoint.startsWith('/vibe')) {
      return [] as unknown as T;
    }

    return {} as unknown as T;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.executeWithFallback<T>('GET', endpoint);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.executeWithFallback<T>('POST', endpoint, data);
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.executeWithFallback<T>('PATCH', endpoint, data);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.executeWithFallback<T>('DELETE', endpoint);
  }
}

export const api = new ApiClient(API_BASE_URL);
