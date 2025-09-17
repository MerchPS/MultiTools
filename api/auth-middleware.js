// api/auth-middleware.js
const validateRequest = (req) => {
    // Cek authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.substring(7);
    return token === process.env.API_SECRET_KEY;
};

module.exports = validateRequest;
