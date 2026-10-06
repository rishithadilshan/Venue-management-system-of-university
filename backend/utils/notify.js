const Notification = require("../models/Notification");

async function notify(userId, { title, message, type = "GENERAL", link = "" }) {
  if (!userId) return null;
  return Notification.create({ user: userId, title, message, type, link });
}

async function notifyMany(userIds, payload) {
  return Promise.all(userIds.filter(Boolean).map((id) => notify(id, payload)));
}

module.exports = { notify, notifyMany };
