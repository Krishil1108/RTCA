// Server-side shared constants
module.exports = {
  MAX_MESSAGE_LENGTH: 2000, // Keep in sync with client UI and Message model maxlength
  MESSAGE_RATE_LIMIT: { windowMs: 5000, max: 8 }, // max messages per window per user
  REACTION_RATE_LIMIT: { windowMs: 10000, max: 15 }, // max reaction ops per window per user
  ALLOWED_MESSAGE_TYPES: ['text', 'image', 'video', 'audio', 'file', 'deleted']
};
