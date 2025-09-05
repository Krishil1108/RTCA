const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  settings: {
    allowAllMembers: {
      type: Boolean,
      default: true
    },
    muteNotifications: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ name: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ 'members.user': 1 });

// Virtual for member count
roomSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to add member
roomSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.equals(userId)
  );
  
  if (!existingMember) {
    this.members.push({ user: userId, role });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove member
roomSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    !member.user.equals(userId)
  );
  return this.save();
};

// Method to check if user is member
roomSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.equals(userId));
};

// Method to get user role in room
roomSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => 
    member.user.equals(userId)
  );
  return member ? member.role : null;
};

// Method to get unread message count for a specific user
roomSchema.methods.getUnreadCount = async function(userId) {
  const Message = require('./Message');
  
  try {
    // Count messages in this room that haven't been read by the user
    const unreadCount = await Message.countDocuments({
      room: this._id,
      sender: { $ne: userId }, // Not sent by the user themselves
      'readBy.user': { $ne: userId } // Not read by the user
    });
    
    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
};

// Static method to get user's rooms with unread counts
roomSchema.statics.getUserRoomsWithUnreadCounts = async function(userId) {
  try {
    const rooms = await this.find({ 'members.user': userId })
      .populate('members.user', 'name email avatar isOnline lastSeen')
      .populate('lastMessage', 'content createdAt sender')
      .populate('lastMessage.sender', 'name')
      .sort({ updatedAt: -1 })
      .exec();

    // Add unread count to each room
    const roomsWithUnreadCounts = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await room.getUnreadCount(userId);
        return {
          ...room.toObject(),
          unreadCount
        };
      })
    );

    return roomsWithUnreadCounts;
  } catch (error) {
    console.error('Error getting rooms with unread counts:', error);
    return [];
  }
};

// Static method to get user's rooms
roomSchema.statics.getUserRooms = function(userId) {
  return this.find({ 'members.user': userId })
    .populate('members.user', 'name email avatar isOnline lastSeen')
    .populate('lastMessage', 'content createdAt sender')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 })
    .exec();
};

module.exports = mongoose.model('Room', roomSchema);
