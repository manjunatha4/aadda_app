"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicePlatform = exports.NotificationType = exports.ReportStatus = exports.MediaType = exports.VibeMood = exports.ActivityCategory = exports.ActivityStatus = exports.ConversationType = exports.AddaRole = exports.Language = void 0;
var Language;
(function (Language) {
    Language["KN"] = "kn";
    Language["EN"] = "en";
})(Language || (exports.Language = Language = {}));
var AddaRole;
(function (AddaRole) {
    AddaRole["OWNER"] = "OWNER";
    AddaRole["ADMIN"] = "ADMIN";
    AddaRole["MEMBER"] = "MEMBER";
})(AddaRole || (exports.AddaRole = AddaRole = {}));
var ConversationType;
(function (ConversationType) {
    ConversationType["DIRECT"] = "DIRECT";
    ConversationType["ADDA"] = "ADDA";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["ACTIVE"] = "ACTIVE";
    ActivityStatus["VOTING"] = "VOTING";
    ActivityStatus["COMPLETED"] = "COMPLETED";
    ActivityStatus["EXPIRED"] = "EXPIRED";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
var ActivityCategory;
(function (ActivityCategory) {
    ActivityCategory["ONE_WORD"] = "ONE_WORD";
    ActivityCategory["MOST_LIKELY"] = "MOST_LIKELY";
    ActivityCategory["VOICE_NOTE"] = "VOICE_NOTE";
    ActivityCategory["EMOJI_ROAST"] = "EMOJI_ROAST";
    ActivityCategory["CUSTOM"] = "CUSTOM";
})(ActivityCategory || (exports.ActivityCategory = ActivityCategory = {}));
var VibeMood;
(function (VibeMood) {
    VibeMood["MENTALLY_OFFLINE"] = "MENTALLY_OFFLINE";
    VibeMood["NEED_GOSSIP"] = "NEED_GOSSIP";
    VibeMood["DEAD_INSIDE"] = "DEAD_INSIDE";
    VibeMood["CHILL_MODE"] = "CHILL_MODE";
    VibeMood["MAIN_CHARACTER"] = "MAIN_CHARACTER";
    VibeMood["BATTERY_LOW"] = "BATTERY_LOW";
})(VibeMood || (exports.VibeMood = VibeMood = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "IMAGE";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["AUDIO"] = "AUDIO";
    MediaType["DOCUMENT"] = "DOCUMENT";
})(MediaType || (exports.MediaType = MediaType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "PENDING";
    ReportStatus["REVIEWED"] = "REVIEWED";
    ReportStatus["DISMISSED"] = "DISMISSED";
    ReportStatus["ACTIONED"] = "ACTIONED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["MESSAGE"] = "MESSAGE";
    NotificationType["CHAOS_CHALLENGE"] = "CHAOS_CHALLENGE";
    NotificationType["VIBE_UPDATE"] = "VIBE_UPDATE";
    NotificationType["INVITE_ACCEPTED"] = "INVITE_ACCEPTED";
    NotificationType["ADDA_JOINED"] = "ADDA_JOINED";
    NotificationType["REACTION"] = "REACTION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var DevicePlatform;
(function (DevicePlatform) {
    DevicePlatform["ANDROID"] = "android";
    DevicePlatform["IOS"] = "ios";
    DevicePlatform["WEB"] = "web";
})(DevicePlatform || (exports.DevicePlatform = DevicePlatform = {}));
