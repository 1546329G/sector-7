import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key'; // ¡Usa una clave secreta fuerte y real en tu .env!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Genera un token JWT para el payload dado.
 * @param {object} payload - Los datos a incluir en el token (ej. { id, username, rol }).
 * @returns {string} El token JWT generado.
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica un token JWT.
 * @param {string} token - El token JWT a verificar.
 * @returns {object|null} El payload decodificado si es válido, o null si es inválido/expirado.
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // console.error('Error al verificar token:', error.message); // Descomentar para depuración
        return null; // El token es inválido o ha expirado
    }
};