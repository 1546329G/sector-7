// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\utils\jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // Importa dotenv para asegurar el acceso a variables de entorno

// Carga las variables de entorno.
// Asumimos que el server.js principal ya carga el .env de la raíz de 'backend'.
// Sin embargo, si api3 se inicia de forma independiente, esta línea es crucial.
// La ruta es relativa al directorio actual (api3/src/utils/)
dotenv.config({ path: process.cwd() + '/backend/.env' }); // Apunta al .env en la raíz de 'backend'

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