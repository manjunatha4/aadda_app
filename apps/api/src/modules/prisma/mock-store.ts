import * as fs from 'fs';
import * as path from 'path';

export interface MockUser {
  id: string;
  email: string;
  phone?: string;
  username: string;
  displayName: string;
  passwordHash?: string;
  avatarUrl?: string;
  bio?: string;
  district?: string;
  language: 'kn' | 'en';
  isVerified: boolean;
  createdAt: Date;
}

export class MockDataStore {
  private dataFilePath = path.join(process.cwd(), 'data', 'aadda-db.json');

  users: MockUser[] = [];
  addas: any[] = [];
  conversations: any[] = [];
  messages: any[] = [];
  vibes: any[] = [];
  challenges: any[] = [];
  invitations: any[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.addas = parsed.addas || [];
        this.conversations = parsed.conversations || [];
        this.messages = parsed.messages || [];
        this.vibes = parsed.vibes || [];
        this.challenges = parsed.challenges || [];
        this.invitations = parsed.invitations || [];
        console.log(`📁 Loaded ${this.users.length} users and ${this.addas.length} addas from disk storage`);
      } else {
        this.saveToDisk();
      }
    } catch (e: any) {
      console.warn('Could not load data file, starting with empty store:', e.message);
    }
  }

  saveToDisk() {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = {
        users: this.users,
        addas: this.addas,
        conversations: this.conversations,
        messages: this.messages,
        vibes: this.vibes,
        challenges: this.challenges,
        invitations: this.invitations,
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('Error saving data to disk:', e.message);
    }
  }
}

export const mockStore = new MockDataStore();
