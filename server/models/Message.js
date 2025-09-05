const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  room: {
    type: String,
    required: true,
    default: 'general'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'deleted'],
    default: 'text'
  },
  // File attachment data
  fileData: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    publicId: String,
    thumbnail: String, // For video files
    blurredThumbnail: String // For privacy-protected image previews
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Read receipts tracking
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ mentions: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString();
});

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from same user if exists
  this.reactions = this.reactions.filter(reaction => 
    !reaction.user.equals(userId)
  );
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function(userId) {
  // Check if already marked as delivered for this user
  const alreadyDelivered = this.deliveredTo.some(delivery => 
    delivery.user.equals(userId)
  );
  
  if (!alreadyDelivered) {
    this.deliveredTo.push({ user: userId });
  }
  return this.save();
};

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  // Check if already marked as read for this user
  const alreadyRead = this.readBy.some(read => 
    read.user.equals(userId)
  );
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
  }
  return this.save();
};

// Virtual to get read receipt status for sender
messageSchema.virtual('readReceiptStatus').get(function() {
  const deliveredCount = this.deliveredTo.length;
  const readCount = this.readBy.length;
  
  if (readCount > 0) {
    return 'read'; // Double blue tick
  } else if (deliveredCount > 0) {
    return 'delivered'; // Double black tick
  } else {
    return 'sent'; // Single tick
  }
});

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    !reaction.user.equals(userId)
  );
  return this.save();
};

// Static method to get recent messages
messageSchema.statics.getRecentMessages = function(room, limit = 50) {
  return this.find({ room })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name email avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'name')
    .exec();
};

module.exports = mongoose.model('Message', messageSchema);
