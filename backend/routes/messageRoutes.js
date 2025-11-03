const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const File = require('../models/File');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Group = require('../models/Group');
const { protect } = require('../middleware/Authentication'); // Import protect middleware

// Helper function to create or update Chat model
async function createOrUpdateChat(chatId, chatModel, senderObj, content) {
try {
  console.log('Backend: Creating/updating Chat model for:', chatId, chatModel);
  
  if (chatModel === 'Group') {
    // For group chats
    const group = await Group.findById(chatId);
    if (!group) {
      console.log('Backend: Group not found for chatId:', chatId);
      return;
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({ chat_id: chatId, is_group: true });
    
    if (!chat) {
      // Create new chat
      chat = new Chat({
        chat_id: chatId,
        is_group: true,
        participants: group.members,
        group_name: group.name,
        group_icon: group.image,
        lastMessage: content,
        lastMessageTime: new Date()
      });
      console.log('Backend: Created new group chat:', chat._id);
    } else {
      // Update existing chat
      chat.lastMessage = content;
      chat.lastMessageTime = new Date();
      console.log('Backend: Updated existing group chat:', chat._id);
    }
    
    await chat.save();
    
  } else {
    // For individual chats
    // Check if chat already exists between these two users
    // For individual chats, we need to find chat where both participants are present
    let chat = await Chat.findOne({ 
      $and: [
        { is_group: false },
        { participants: senderObj.id },
        { participants: chatId }
      ]
    });
    
    console.log('Backend: Looking for individual chat with chatId:', chatId);
    console.log('Backend: Found chat:', chat ? chat._id : 'None');
    
    if (!chat) {
      // Create new individual chat
      // For individual chats, use the other participant's ID as chat_id
      const otherParticipant = chatId === senderObj.id ? 'unknown' : chatId;
      chat = new Chat({
        chat_id: otherParticipant,
        is_group: false,
        participants: [senderObj.id, otherParticipant],
        lastMessage: content,
        lastMessageTime: new Date()
      });
      console.log('Backend: Created new individual chat:', chat._id, 'with participants:', [senderObj.id, otherParticipant]);
      console.log('Backend: Chat participants array:', chat.participants);
    } else {
      // Update existing chat
      chat.lastMessage = content;
      chat.lastMessageTime = new Date();
      console.log('Backend: Updated existing individual chat:', chat._id);
      console.log('Backend: Chat participants array:', chat.participants);
    }
    
    await chat.save();
  }
  
} catch (error) {
  console.error('Backend: Error creating/updating Chat model:', error);
}
}

// Handle preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

// Get messages for a chat between two users or a group
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.query;
    
    console.log('Backend: Message API called with chatId:', chatId, 'userId:', userId);
    
    const Group = require('../models/Group');
    const group = await Group.findById(chatId);
    let messages;
    
    if (group) {
      // Group chat: return all messages
      messages = await Message.find({ chat: chatId }).populate('file');
      console.log('Backend: Group chat - returning all messages:', messages.length);
    } else {
      // Individual chat: only show messages where userId is involved
      // For individual chats, we need to find messages where:
      // 1. chat = chatId (the other user's ID) AND sender = userId (messages sent by requesting user)
      // 2. OR chat = userId AND sender = chatId (messages sent to requesting user)
      
      console.log('Backend: Individual chat - chatId:', chatId, 'userId:', userId);
      
      // Check if userId is a valid ObjectId (faculty) or registration number (student)
      const isUserIdObjectId = require('mongoose').Types.ObjectId.isValid(userId);
      
      let messagesToUser, messagesFromUser;
      
      if (isUserIdObjectId) {
        // If userId is ObjectId (faculty), use normal logic
        messagesToUser = await Message.find({ 
          chat: chatId, 
          'sender.id': userId 
        }).populate('file');
        
        messagesFromUser = await Message.find({ 
          chat: userId, 
          'sender.id': chatId 
        }).populate('file');
      } else {
        // If userId is registration number (student), adjust the query
        // For students, we need to find messages where:
        // 1. chat = chatId AND sender.id = userId (messages sent by student to faculty)
        // 2. chat = student's ObjectId AND sender.id = chatId (messages sent by faculty to student)
        
        // First, find messages sent by student to faculty
        messagesToUser = await Message.find({ 
          chat: chatId, 
          'sender.id': userId 
        }).populate('file');
        
        // For messages from faculty to student, we need to find messages where
        // chat = student's ObjectId AND sender.id = faculty's ObjectId
        // We need to get student's ObjectId from the registration number
        const Student = require('../models/Student');
        const student = await Student.findOne({ registration_number: userId });
        
        if (student) {
          messagesFromUser = await Message.find({ 
            chat: student._id, 
            'sender.id': chatId 
          }).populate('file');
        } else {
          messagesFromUser = [];
        }
        
        console.log('Backend: Student message query - messagesToUser:', messagesToUser.length);
        console.log('Backend: Student message query - messagesFromUser:', messagesFromUser.length);
        console.log('Backend: Student found:', student ? student._id : 'Not found');
      }
      
      messages = [...messagesToUser, ...messagesFromUser];
      
      console.log('Backend: Messages sent by user to chatId:', messagesToUser.length);
      console.log('Backend: Messages sent by chatId to user:', messagesFromUser.length);
      console.log('Backend: Total individual chat messages:', messages.length);
      console.log('Backend: Sample messages:', messages.slice(0, 2));
    }
    
    res.json(messages);
  } catch (err) {
    console.error('Backend: Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  try {
     const { chat, chatModel, content, fileId, sender, senderId, senderName, email, registration_number } = req.body;
    
    // Create sender object based on the data provided
    let senderObj;
    if (sender && typeof sender === 'object') {
      // If sender is already an object, use it
      senderObj = sender;
    } else {
      // Create sender object from individual fields
      senderObj = {
        id: senderId || sender || '',
        name: senderName || 'Unknown',
        email: email || 'no-email@example.com', // Provide default email if empty
        registration_number: registration_number || '',
        role: registration_number ? 'student' : 'faculty'
      };
    }
    
    console.log('Backend: Creating message with sender:', senderObj);
    console.log('Backend: Chat:', chat, 'ChatModel:', chatModel, 'Content:', content);
    
    const message = new Message({ sender: senderObj, chat, chatModel, content });
    if (fileId) message.file = fileId;
    await message.save();
    
    // Create or update Chat model
    try {
      await createOrUpdateChat(chat, chatModel, senderObj, content);
    } catch (chatError) {
      console.error('Backend: Error in createOrUpdateChat:', chatError);
      // Don't fail the message creation if chat update fails
    }
    
    console.log('Backend: Message saved successfully:', message._id);
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Backend: Error creating message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update message (for adding file reference)
router.patch('/:id', async (req, res) => {
  try {
    const { fileId } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { file: fileId },
      { new: true }
    ).populate('file');
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pin/Unpin message
router.post('/:id/pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { pinned: !!pin },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
