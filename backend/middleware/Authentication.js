const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    console.log('🔐 PROTECT MIDDLEWARE CALLED');
    console.log('🔐 Request URL:', req.url);
    console.log('🔐 Authorization header:', req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('🔐 Token extracted:', token.substring(0, 20) + '...');
            console.log('🔐 JWT_SECRET exists:', !!process.env.JWT_SECRET);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('🔐 Token decoded successfully:', decoded);
            req.user = decoded; // Use JWT payload directly
            next();
        } catch (error) {
            console.error('🔐 Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const faculty = (req, res, next) => {
    if (req.user && req.user.role === 'Faculty') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a faculty' });
    }
};

module.exports = { protect, admin, faculty };
