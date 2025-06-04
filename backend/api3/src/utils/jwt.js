// api3/src/utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Adjust path if .env is not in api3 root, but in your project root

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.');
    process.exit(1); // Exit if secret is not set, as security is compromised
}

export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // console.error('Error verifying token:', error.message);
        return null; // Return null if token is invalid or expired
    }
};