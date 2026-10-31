# AADDA — Master Architecture & Implementation Plan
*Tagline: "Your people. Your chaos."*
*Colors: Deep Purple (`#24183B`), Electric Lime (`#D9FF67`), Coral (`#FF786B`), Lavender (`#F4F0FF`), White (`#FFFFFF`)*

---

## 1. System Overview

**AADDA** is an invite-only private digital hangout for close friend circles, featuring:
- **Kannada-first Localization**: Full UI, onboarding, and seeded challenges in Kannada (`kn`), with seamless toggle to English (`en`).
- **Chaotic Gen-Z Visual Design**: High-contrast dark purple backdrop, electric lime neon highlights, expressive mood badges, micro-interactions, and custom reactions.
- **High-Security Monolith API**: NestJS, PostgreSQL 16 via Prisma ORM, Redis 7 for pub/sub & Socket.IO adapter, Argon2id cryptographic password hashing, rotating JWT refresh tokens.
- **Real-Time Engine**: Socket.IO with delivery acknowledgements, authorized room membership, typing indicators, read receipts, and online presence tracking.
- **Signature Feature: Chaos Engine**: Random friend challenges (*"Describe your best friend in one word"*, *"Most likely to..."*, dramatic Kannada movie voice notes, emoji mood roasts) with real-time participation & voting.
- **Signature Feature: Vibe Check**: Ephemeral synchronized statuses (*"Mentally offline"*, *"Need gossip"*, *"Dead inside"*, *"Chill mode"*, *"Main character"*, *"Social battery 1%"*).
- **Invite-Only Cryptographic Adda Management**: Secure hashed invitation codes (`ADDA-XXXX`) with expiry and usage counters.
- **Production Mobile App**: React Native (Expo SDK 52+), NativeWind (Tailwind CSS), Expo Router, Zustand, TanStack Query, SecureStore, Socket.IO client, and i18next.

---

## 2. Monorepo Structure

```text
c:/chatapp/
├── apps/
│   ├── api/                     # NestJS Backend (REST + Socket.IO + Prisma)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Argon2id, JWT, Refresh Token Rotation
│   │   │   │   ├── users/       # Profiles, Search, Districts, Languages
│   │   │   │   ├── addas/       # Private Adda rooms & memberships
│   │   │   │   ├── invitations/ # Cryptographic invite codes & acceptance
│   │   │   │   ├── conversations/# Direct chats & Adda group channels
│   │   │   │   ├── messages/    # Real-time messages, pagination, reactions, receipts
│   │   │   │   ├── chaos-engine/# Friend challenges, submissions & voting
│   │   │   │   ├── vibe-check/  # Ephemeral synced status engine
│   │   │   │   ├── notifications/# Alerts & in-app notifications
│   │   │   │   ├── uploads/     # S3 / MinIO / Local media uploads
│   │   │   │   ├── moderation/  # Blocking, Reporting
│   │   │   │   ├── realtime/    # Socket.IO Gateway & Redis Adapter
│   │   │   │   └── prisma/      # Global database service
│   │   │   ├── prisma/          # schema.prisma (17 models) & seed.ts
│   │   │   └── main.ts          # Swagger docs, CORS, WebSocket adapter
│   │   ├── test/                # E2E & unit tests
│   │   └── package.json
│   └── mobile/                  # React Native + Expo Mobile App
│       ├── app/                 # Expo Router file-based screens
│       │   ├── (auth)/          # Login, Register, Language toggle
│       │   ├── (tabs)/          # Addas, Chats, Chaos, Profile
│       │   ├── adda/[id]/       # Adda details, invites, members
│       │   ├── chat/[id]/       # Real-time chat, reactions, typing
│       │   ├── chaos/[id]/      # Challenge submissions & votes
│       │   └── modal/           # Vibe check modal, Create Adda modal
│       ├── src/
│       │   ├── components/      # Gen-Z design system (VibePill, ChaosCard, MessageBubble)
│       │   ├── stores/          # Zustand stores (auth, chat, vibe)
│       │   ├── services/        # API client, Socket.IO client, SecureStore
│       │   └── i18n/            # Kannada & English localization
│       └── package.json
├── packages/
│   ├── shared/                  # Common TypeScript DTOs, Enums, Socket event types
│   │   ├── src/
│   │   │   ├── enums/           # AddaRole, VibeMood, ActivityStatus, Language, etc.
│   │   │   ├── dtos/            # Auth, Adda, Message, Chaos DTOs
│   │   │   ├── events/          # SocketEvents & payload contracts
│   │   │   └── types/           # UserProfile, AddaSummary, etc.
│   │   └── package.json
│   └── config/                  # Shared ESLint, TSConfig, Prettier
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.mobile
│   └── nginx/
│       └── nginx.conf
├── docker-compose.yml           # PostgreSQL 16 + Redis 7 + MinIO (S3) + API
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── README.md
```

---

## 3. Database Entities (Prisma & PostgreSQL)

The schema defines all **17 required entities**:
1. **User**: Credentials, profiles, Kannada/English language, district, soft-delete.
2. **RefreshToken**: Cryptographically hashed tokens with rotation & revocation tracking.
3. **DeviceToken**: Push notification tokens (Android / iOS / Web).
4. **Adda**: Private group hangouts created by users.
5. **AddaMember**: Role-based membership (`OWNER`, `ADMIN`, `MEMBER`).
6. **Invitation**: Cryptographically hashed invite codes with usage counters & expiry.
7. **Conversation**: `DIRECT` or `ADDA` channels.
8. **ConversationMember**: Membership with read tracking (`lastReadMessageId`, `lastReadAt`).
9. **Message**: Chat messages with media attachments, reply threads, and idempotency protection.
10. **MessageReaction**: Emoji reactions per message and user.
11. **Activity (Chaos Engine)**: Challenges in Kannada & English with statuses (`ACTIVE`, `VOTING`, `COMPLETED`, `EXPIRED`).
12. **ActivityEntry**: Member submissions for chaos challenges with vote counts.
13. **VibeStatus**: Ephemeral statuses with 6 core mood states and custom notes.
14. **Notification**: In-app alerts for messages, challenges, and vibes.
15. **UserBlock**: User-to-user blocking.
16. **UserReport**: Community moderation reports on users or messages.
17. **MediaUpload**: Upload metadata for audio, video, images, and documents.

---

## 4. Quick Start & Execution Guide

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Start Infrastructure (PostgreSQL, Redis, MinIO)
```bash
docker compose up -d postgres redis minio
```

### Step 3: Run Database Migrations & Seed
```bash
# Generate Prisma Client
pnpm run prisma:generate

# Push schema to PostgreSQL database
npx prisma db push --schema apps/api/prisma/schema.prisma

# Seed initial Kannada data & demo users
pnpm run prisma:seed
```

### Step 4: Start Backend API & Socket.IO Gateway
```bash
pnpm run dev:api
```
- API Endpoint: `http://localhost:4000/api`
- Swagger Docs: `http://localhost:4000/api/docs`
- Socket.IO Gateway: `http://localhost:4000`

### Step 5: Start Mobile App (Expo)
```bash
pnpm run dev:mobile
```
- Or run web preview: `pnpm --filter @aadda/mobile run web`

---

## 5. Seed Credentials

| User | Username | Email | Password | District |
|---|---|---|---|---|
| Praveen Kumar | `praveen_k` | `praveen@aadda.app` | `AaddaSecret123!` | Bengaluru Urban |
| Ananya Gowda | `ananya_gowda` | `ananya@aadda.app` | `AaddaSecret123!` | Mysuru |
| Karthik | `karthik_hubballi` | `karthik@aadda.app` | `AaddaSecret123!` | Dharwad |

**Pre-seeded Adda**:
- Name: **ಕಟ್ಟೆ ಗ್ಯಾಂಗ್ ⚡ (Katte Gang)**
- Invite Code: **KATTE2026**

