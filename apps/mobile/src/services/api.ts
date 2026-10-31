import { storage } from './storage';

declare const process: any;

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
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

  async get<T = any>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Network request failed');
    }
    return res.json();
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Network request failed');
    }
    return res.json();
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Network request failed');
    }
    return res.json();
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Network request failed');
    }
    return res.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
