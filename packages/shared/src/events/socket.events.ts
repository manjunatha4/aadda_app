export enum SocketEvents {
  // Connection & Auth
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  UNAUTHORIZED = 'unauthorized',

  // Presence
  PRESENCE_ONLINE = 'presence:online',
  PRESENCE_OFFLINE = 'presence:offline',
  USER_STATUS_CHANGED = 'user:status_changed',

  // Rooms / Adda Channels
  JOIN_ROOM = 'room:join',
  LEAVE_ROOM = 'room:leave',
  ROOM_JOINED = 'room:joined',
  ROOM_LEFT = 'room:left',

  // Messages
  SEND_MESSAGE = 'message:send',
  NEW_MESSAGE = 'message:new',
  MESSAGE_ACK = 'message:ack',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_READ = 'message:read',
  READ_RECEIPT = 'message:read_receipt',

  // Typing
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  USER_TYPING = 'user:typing',

  // Reactions
  ADD_REACTION = 'reaction:add',
  REMOVE_REACTION = 'reaction:remove',
  REACTION_UPDATED = 'reaction:updated',

  // Vibe Check
  SET_VIBE = 'vibe:set',
  VIBE_UPDATED = 'vibe:updated',

  // Chaos Engine
  CHAOS_NEW_CHALLENGE = 'chaos:new_challenge',
  CHAOS_SUBMISSION = 'chaos:submission',
  CHAOS_VOTE = 'chaos:vote',
  CHAOS_ROUND_ENDED = 'chaos:round_ended',

  // Adda Buzz
  BUZZ_POST_CREATED = 'buzz:post:created',
  BUZZ_POST_DELETED = 'buzz:post:deleted',
  BUZZ_REACTION_UPDATED = 'buzz:reaction:updated',
  BUZZ_COMMENT_ADDED = 'buzz:comment:added',
  BUZZ_POLL_VOTED = 'buzz:poll:voted',
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  username: string;
}

export interface MessageAckPayload {
  clientMessageId?: string;
  messageId: string;
  conversationId: string;
  timestamp: string;
}

export interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  messageId: string;
  readAt: string;
}

export interface ReactionPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
}

