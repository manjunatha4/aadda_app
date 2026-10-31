import { PrismaClient, Language, AddaRole, ConversationType, ActivityStatus, ActivityCategory, VibeMood } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AADDA database...');

  // Clear existing
  await prisma.activityEntry.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.vibeStatus.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.addaMember.deleteMany();
  await prisma.adda.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userBlock.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.mediaUpload.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await argon2.hash('AaddaSecret123!');

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      email: 'praveen@aadda.app',
      phone: '+919876543210',
      username: 'praveen_k',
      displayName: 'ಪ್ರವೀಣ್ ಕುಮಾರ್ (Praveen)',
      passwordHash: defaultPassword,
      bio: 'ಬೆಂಗಳೂರು ಚಾಯ್ ಪ್ರೇಮಿ ☕ | Software & Chaos',
      district: 'Bengaluru Urban',
      language: Language.kn,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'ananya@aadda.app',
      phone: '+919876543211',
      username: 'ananya_gowda',
      displayName: 'ಅನನ್ಯಾ ಗೌಡ (Ananya)',
      passwordHash: defaultPassword,
      bio: 'Mysuru Queen 👑 | Design & Cinema Buff',
      district: 'Mysuru',
      language: Language.kn,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'karthik@aadda.app',
      phone: '+919876543212',
      username: 'karthik_hubballi',
      displayName: 'ಕಾರ್ತಿಕ್ (Karthik)',
      passwordHash: defaultPassword,
      bio: 'ಉತ್ತರ ಕರ್ನಾಟಕ ವೈಬ್ಸ್ 🔥 | Full time memer',
      district: 'Dharwad',
      language: Language.kn,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    },
  });

  console.log(`✅ Created users: ${user1.username}, ${user2.username}, ${user3.username}`);

  // Create Adda
  const adda1 = await prisma.adda.create({
    data: {
      name: 'ಕಟ್ಟೆ ಗ್ಯಾಂಗ್ ⚡ (Katte Gang)',
      description: 'Private hangout for weekend plan roasts and chaotic gossip.',
      creatorId: user1.id,
      avatarUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80',
    },
  });

  // Memberships
  await prisma.addaMember.createMany({
    data: [
      { addaId: adda1.id, userId: user1.id, role: AddaRole.OWNER },
      { addaId: adda1.id, userId: user2.id, role: AddaRole.ADMIN },
      { addaId: adda1.id, userId: user3.id, role: AddaRole.MEMBER },
    ],
  });

  // Create Invitation Code
  const inviteCodeHash = await argon2.hash('KATTE2026');
  await prisma.invitation.create({
    data: {
      addaId: adda1.id,
      creatorId: user1.id,
      codeHash: inviteCodeHash,
      maxUses: 10,
      usedCount: 2,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Conversation for Adda
  const conversation1 = await prisma.conversation.create({
    data: {
      type: ConversationType.ADDA,
      addaId: adda1.id,
    },
  });

  await prisma.conversationMember.createMany({
    data: [
      { conversationId: conversation1.id, userId: user1.id },
      { conversationId: conversation1.id, userId: user2.id },
      { conversationId: conversation1.id, userId: user3.id },
    ],
  });

  // Messages
  const msg1 = await prisma.message.create({
    data: {
      conversationId: conversation1.id,
      senderId: user1.id,
      content: 'ಗುಡ್ ಮಾರ್ನಿಂಗ್ ಮಚ್ಚಾ! ಇವತ್ತು ಸಂಜೆ ಮಲ್ಲೇಶ್ವರಂ CTR ಬೆಣ್ಣೆ ದೋಸೆಗೆ ಹೋಗೋಣ್ವಾ? 🥞',
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: conversation1.id,
      senderId: user2.id,
      content: 'ಖಂಡಿತ! ನಾನು 5 ಗಂಟೆಗೆ ರೆಡಿ ಇರ್ತೀನಿ. ಬರೋರು ಕೈ ಎತ್ತಿ! 🙋‍♀️',
      replyToId: msg1.id,
    },
  });

  await prisma.messageReaction.create({
    data: {
      messageId: msg2.id,
      userId: user3.id,
      emoji: '🔥',
    },
  });

  // Chaos Engine Activity
  const chaos1 = await prisma.activity.create({
    data: {
      addaId: adda1.id,
      creatorId: user2.id,
      promptText: 'Describe Karthik in one word or Kannada slang!',
      promptTextKn: 'ಕಾರ್ತಿಕ್‌ನನ್ನು ಒಂದೇ ಒಂದು ಕನ್ನಡ ಪದ ಅಥವಾ ಸ್ಲ್ಯಾಂಗ್‌ನಲ್ಲಿ ವರ್ಣಿಸಿ!',
      category: ActivityCategory.ONE_WORD,
      status: ActivityStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });

  await prisma.activityEntry.createMany({
    data: [
      {
        activityId: chaos1.id,
        userId: user1.id,
        content: 'ಗುಂಡು ಮುರುಗೇಶ 🤣',
        voteCount: 3,
      },
      {
        activityId: chaos1.id,
        userId: user2.id,
        content: 'ವೈಬ್ ಕಿಲ್ಲರ್ ಕಿಂಗ್ 👑',
        voteCount: 5,
      },
    ],
  });

  // Vibe Statuses
  await prisma.vibeStatus.createMany({
    data: [
      {
        userId: user1.id,
        addaId: adda1.id,
        mood: VibeMood.CHILL_MODE,
        customNote: 'ಫಿಲ್ಟರ್ ಕಾಫಿ ಮೂಡ್ ☕',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
      {
        userId: user2.id,
        addaId: adda1.id,
        mood: VibeMood.NEED_GOSSIP,
        customNote: 'ಯಾರಾದ್ರೂ ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್ ಇದ್ರೆ ಹೇಳಿ 👀',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
      {
        userId: user3.id,
        addaId: adda1.id,
        mood: VibeMood.BATTERY_LOW,
        customNote: 'ಸೋಮವಾರದ ಹ್ಯಾಂಗೊವರ್ 💀',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

