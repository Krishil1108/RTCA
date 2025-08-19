const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');

const initializeDefaultData = async () => {
  try {
    // Create default "General" room if it doesn't exist
    let generalRoom = await Room.findOne({ name: 'General' });
    
    if (!generalRoom) {
      // Create a system user for default room creation
      let systemUser = await User.findOne({ email: 'system@rtca.local' });
      
      if (!systemUser) {
        systemUser = new User({
          email: 'system@rtca.local',
          name: 'System',
          avatar: 'https://ui-avatars.com/api/?name=System&background=666&color=fff'
        });
        await systemUser.save();
      }

      generalRoom = new Room({
        name: 'General',
        description: 'General discussion room for all users',
        type: 'public',
        createdBy: systemUser._id,
        members: [{
          user: systemUser._id,
          role: 'admin'
        }],
        settings: {
          allowAllMembers: true,
          muteNotifications: false
        }
      });

      await generalRoom.save();
      console.log('✅ Default General room created');
    }

    // Auto-add new users to the General room (this will be handled in user registration)
    
  } catch (error) {
    console.error('❌ Error initializing default data:', error);
  }
};

module.exports = { initializeDefaultData };
