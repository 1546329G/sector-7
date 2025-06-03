// backend/api3/src/utils/jwt.js (CONVERTED TO ES MODULES)

import jwt from 'jsonwebtoken'; // <-- CHANGE: Use import instead of require
import 'dotenv/config'; // <-- IMPORTANT: Add this to load .env variables if not loaded elsewhere before this module.
                        //               Alternatively, you might need to import dotenv and call dotenv.config()
                        //               if this file runs before your main server.js has loaded it.
                        //               For simplicity, assuming 'dotenv/config' is fine.

export const generateToken = (payload) => { // <-- CHANGE: Add 'export const'
  // Usa process.env.JWT_SECRET para obtener el secreto del .env
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token) => { // <-- CHANGE: Add 'export const'
  try {
    // Usa process.env.JWT_SECRET para obtener el secreto del .env
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // console.error("Error al verificar token:", error.message); // Optional for debugging
    return null; // Token inválido o expirado
  }
};

// <-- REMOVE THE FOLLOWING COMMONJS EXPORT:
// module.exports = {
//   generateToken,
//   verifyToken,
// };