const activeUsers = {}; // Store user-socket mappings (now as arrays)
const User = require('./models/User');
const Message = require('./models/Message');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Socket log file path
const socketLogFile = path.join(logsDir, 'socket.log');

// Function to log socket events to file
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Log to console
    console.log(logMessage.trim());
    
    // Append to file
    fs.appendFile(socketLogFile, logMessage, (err) => {
        if (err) {
            console.error('Error writing to socket log file:', err);
        }
    });
}

// Test log entry when module loads
logToFile('Socket.js module loaded successfully');

// Lead locking store (in-memory). For multi-instance scale, move to Redis/DB.
const leadLocks = new Map(); // leadId -> { userId, userName, socketId, expiresAt }
const LOCK_TTL_MS = 5 * 60 * 1000;

function isExpired(lock) {
    return !lock || Date.now() > lock.expiresAt;
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        logToFile(`Socket connection established: ${socket.id}`);

        // Add connection error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Register a user with their socket (support multiple sockets per user)
        socket.on('registerUser', async (userId) => {
            try {
                logToFile(`Backend: Registering user ${userId} with socket ${socket.id}`);
                
                // Check if user exists in database
                let userExists = await User.findById(userId);
                logToFile(`Backend: User ${userId} exists in DB: ${!!userExists}`);
                
                // If user doesn't exist, it's likely a Student Portal user - track in memory only
                if (!userExists) {
                    logToFile(`Backend: User ${userId} not found in DB - likely Student Portal user, tracking in memory only`);
                    // Don't create database record for Student Portal users
                    // Just track them in activeUsers for socket management
                }
                
                if (userExists) {
                    logToFile(`Backend: User details: ${JSON.stringify({ _id: userExists._id, name: userExists.name, email: userExists.email })}`);
                }
                
                if (!activeUsers[userId]) activeUsers[userId] = [];
                if (!activeUsers[userId].includes(socket.id)) {
                    activeUsers[userId].push(socket.id);
                }
                
                // Set user online in DB - only if user exists (IMS users only)
                if (userExists) {
                    try {
                        const updateResult = await User.findByIdAndUpdate(userId, { online: true });
                        logToFile(`Backend: Update result for IMS user ${userId}: ${!!updateResult}`);
                    } catch (updateError) {
                        logToFile(`Backend: Error updating IMS user ${userId} online status: ${updateError.message}`);
                    }
                } else {
                    logToFile(`Backend: Student Portal user ${userId} - tracking in memory only, not updating DB`);
                }
                
                // Emit updated online status to all clients (IMS users + Student Portal users)
                const onlineUsers = await User.find({ online: true }, '_id name online');
                
                // Add Student Portal users to the online list
                const studentPortalUsers = [];
                for (const [userId, socketIds] of Object.entries(activeUsers)) {
                    const userExists = await User.findById(userId);
                    if (!userExists && socketIds.length > 0) {
                        // This is a Student Portal user who is online
                        studentPortalUsers.push({
                            _id: userId,
                            name: 'Student', // Default name, will be updated from message data
                            online: true
                        });
                    }
                }
                
                const allOnlineUsers = [...onlineUsers, ...studentPortalUsers];
                logToFile(`Backend: Online IMS users: ${JSON.stringify(onlineUsers.map(u => ({ _id: u._id, name: u.name, online: u.online })))}`);
                logToFile(`Backend: Student Portal users: ${JSON.stringify(studentPortalUsers)}`);
                logToFile(`Backend: Looking for Aarti Kumari (6804391367f6185a8585f05c) in all online users: ${JSON.stringify(allOnlineUsers.find(u => u._id.toString() === '6804391367f6185a8585f05c'))}`);
                io.emit('userOnlineStatus', allOnlineUsers);
                logToFile(`Backend: User ${userId} registered with socket ${socket.id}. Active users: ${JSON.stringify(activeUsers)}`);
            } catch (error) {
                logToFile(`Error registering user: ${error.message}`);
            }
        });

        // Real-time message handling (emit to all sockets of the receiver)
        socket.on('sendMessage', async (msg) => {
            const { receiverId, _id, chatId, sender } = msg;
            console.log('Backend: Received sendMessage event:', { msg, receiverId, sender, chatId });
            console.log('Backend: activeUsers:', activeUsers);
            
            if (receiverId) {
                // One-to-one chat (old logic)
                const receiverSockets = activeUsers[receiverId] || [];
                console.log('Backend: One-to-one chat - receiverId:', receiverId, 'receiverSockets:', receiverSockets);
                receiverSockets.forEach(sid => {
                    console.log('Backend: Emitting to socket:', sid);
                    io.to(sid).emit('receiveMessage', msg);
                });
                // Optionally, also emit to sender for confirmation
                socket.emit('receiveMessage', msg);
                // Mark as delivered if receiver is online
                if (receiverSockets.length > 0 && _id) {
                    await Message.findByIdAndUpdate(_id, { delivered: true });
                    io.to(socket.id).emit('messageDelivered', { messageId: _id });
                }
            } else if (chatId) {
                // Group chat: fetch group members and emit to all except sender
                const Group = require('./models/Group');
                const group = await Group.findById(chatId);
                console.log('Backend: Group chat - chatId:', chatId, 'sender:', sender);
                console.log('Backend: Group members (raw):', group?.members);
                
                if (group && Array.isArray(group.members)) {
                    // Handle mixed member types (ObjectIds and strings)
                    const memberIds = group.members.map(member => {
                        if (typeof member === 'string') {
                            return member; // Student registration number
                        } else if (member && member._id) {
                            return member._id.toString(); // IMS User ObjectId
                        } else {
                            return member.toString(); // Fallback
                        }
                    });
                    
                    console.log('Backend: Processed member IDs:', memberIds);
                    
                    memberIds.forEach(memberId => {
                        if (memberId !== sender) {
                            const sockets = activeUsers[memberId] || [];
                            console.log(`Backend: Emitting to member ${memberId}, sockets:`, sockets);
                            sockets.forEach(sid => {
                                console.log(`Backend: Emitting receiveMessage to socket ${sid}`);
                                io.to(sid).emit('receiveMessage', msg);
                            });
                        }
                    });
                }
                // Also emit to sender for confirmation
                socket.emit('receiveMessage', msg);
            }
        });

        // Mark message as read
        socket.on('messageRead', async ({ messageId, userId }) => {
            await Message.findByIdAndUpdate(messageId, { read: true });
            // Optionally, notify sender
            io.emit('messageRead', { messageId, userId });
        });

        // ===== Lead Locking (claim / release / heartbeat) =====
        socket.on('lead:claim', (payload = {}, ack) => {
            try {
                const { leadId, userId, userName } = payload;
                if (!leadId || !userId) {
                    console.error('Invalid lead claim payload:', payload);
                    return typeof ack === 'function' && ack({ ok: false, error: 'Invalid payload' });
                }
                const current = leadLocks.get(leadId);
                if (!current || isExpired(current)) {
                    const newLock = {
                        userId,
                        userName: userName || 'User',
                        socketId: socket.id,
                        expiresAt: Date.now() + LOCK_TTL_MS,
                    };
                    leadLocks.set(leadId, newLock);
                    socket.join(leadId);
                    io.to(leadId).emit('lead:locked', { leadId, lockedBy: { userId, userName: newLock.userName } });
                    console.log(`Lead ${leadId} claimed by user ${userId}`);
                    return typeof ack === 'function' && ack({ ok: true });
                }
                console.log(`Lead ${leadId} already locked by user ${current.userId}`);
                return typeof ack === 'function' && ack({ ok: false, lockedBy: { userId: current.userId, userName: current.userName } });
            } catch (e) {
                console.error('Error in lead:claim:', e);
                return typeof ack === 'function' && ack({ ok: false, error: 'Internal error' });
            }
        });

        socket.on('lead:heartbeat', (leadId) => {
            const lock = leadLocks.get(leadId);
            if (lock && lock.socketId === socket.id) {
                lock.expiresAt = Date.now() + LOCK_TTL_MS;
                leadLocks.set(leadId, lock);
            }
        });

        socket.on('lead:release', (leadId) => {
            const lock = leadLocks.get(leadId);
            if (lock && lock.socketId === socket.id) {
                leadLocks.delete(leadId);
                io.to(leadId).emit('lead:released', { leadId });
                socket.leave(leadId);
            }
        });

        // On disconnect, remove this socket from all users
        socket.on('disconnect', async (reason) => {
            logToFile(`Socket ${socket.id} disconnected. Reason: ${reason}`);
            
            try {
                // Clean up any locks held by this socket first
                for (const [leadId, lock] of Array.from(leadLocks.entries())) {
                    if (lock.socketId === socket.id) {
                        leadLocks.delete(leadId);
                        io.to(leadId).emit('lead:released', { leadId });
                        logToFile(`Released lock for lead ${leadId} due to disconnect`);
                    }
                }

                // Remove socket from active users
                for (const [userId, socketIds] of Object.entries(activeUsers)) {
                    activeUsers[userId] = socketIds.filter(sid => sid !== socket.id);
                    if (activeUsers[userId].length === 0) {
                        delete activeUsers[userId];
                        // Set user offline in DB - only if it's an IMS user
                        const userExists = await User.findById(userId);
                        if (userExists) {
                            await User.findByIdAndUpdate(userId, { online: false });
                            logToFile(`IMS user ${userId} set offline due to disconnect`);
                        } else {
                            logToFile(`Student Portal user ${userId} disconnected (no DB update needed)`);
                        }
                    }
                }
                
                // Emit updated online status to all clients (IMS users + Student Portal users)
                const onlineUsers = await User.find({ online: true }, '_id name online');
                
                // Add Student Portal users to the online list
                const studentPortalUsers = [];
                for (const [userId, socketIds] of Object.entries(activeUsers)) {
                    const userExists = await User.findById(userId);
                    if (!userExists && socketIds.length > 0) {
                        // This is a Student Portal user who is online
                        studentPortalUsers.push({
                            _id: userId,
                            name: 'Student', // Default name, will be updated from message data
                            online: true
                        });
                    }
                }
                
                const allOnlineUsers = [...onlineUsers, ...studentPortalUsers];
                logToFile(`Backend: After disconnect - Online users: ${JSON.stringify(allOnlineUsers.map(u => ({ _id: u._id, name: u.name, online: u.online })))}`);
                io.emit('userOnlineStatus', allOnlineUsers);
                logToFile(`Socket ${socket.id} disconnected and cleaned up.`);
            } catch (error) {
                logToFile(`Error during socket disconnect cleanup: ${error.message}`);
            }
        });
    });

    // Periodic cleanup of expired locks
    setInterval(() => {
        const now = Date.now();
        for (const [leadId, lock] of Array.from(leadLocks.entries())) {
            if (now > lock.expiresAt) {
                leadLocks.delete(leadId);
                io.to(leadId).emit('lead:released', { leadId });
            }
        }
    }, 30000);
};
