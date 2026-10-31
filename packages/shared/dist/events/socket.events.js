"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
var SocketEvents;
(function (SocketEvents) {
    // Connection & Auth
    SocketEvents["AUTHENTICATE"] = "authenticate";
    SocketEvents["AUTHENTICATED"] = "authenticated";
    SocketEvents["UNAUTHORIZED"] = "unauthorized";
    // Presence
    SocketEvents["PRESENCE_ONLINE"] = "presence:online";
    SocketEvents["PRESENCE_OFFLINE"] = "presence:offline";
    SocketEvents["USER_STATUS_CHANGED"] = "user:status_changed";
    // Rooms / Adda Channels
    SocketEvents["JOIN_ROOM"] = "room:join";
    SocketEvents["LEAVE_ROOM"] = "room:leave";
    SocketEvents["ROOM_JOINED"] = "room:joined";
    SocketEvents["ROOM_LEFT"] = "room:left";
    // Messages
    SocketEvents["SEND_MESSAGE"] = "message:send";
    SocketEvents["NEW_MESSAGE"] = "message:new";
    SocketEvents["MESSAGE_ACK"] = "message:ack";
    SocketEvents["MESSAGE_EDITED"] = "message:edited";
    SocketEvents["MESSAGE_DELETED"] = "message:deleted";
    SocketEvents["MESSAGE_READ"] = "message:read";
    SocketEvents["READ_RECEIPT"] = "message:read_receipt";
    // Typing
    SocketEvents["TYPING_START"] = "typing:start";
    SocketEvents["TYPING_STOP"] = "typing:stop";
    SocketEvents["USER_TYPING"] = "user:typing";
    // Reactions
    SocketEvents["ADD_REACTION"] = "reaction:add";
    SocketEvents["REMOVE_REACTION"] = "reaction:remove";
    SocketEvents["REACTION_UPDATED"] = "reaction:updated";
    // Vibe Check
    SocketEvents["SET_VIBE"] = "vibe:set";
    SocketEvents["VIBE_UPDATED"] = "vibe:updated";
    // Chaos Engine
    SocketEvents["CHAOS_NEW_CHALLENGE"] = "chaos:new_challenge";
    SocketEvents["CHAOS_SUBMISSION"] = "chaos:submission";
    SocketEvents["CHAOS_VOTE"] = "chaos:vote";
    SocketEvents["CHAOS_ROUND_ENDED"] = "chaos:round_ended";
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
