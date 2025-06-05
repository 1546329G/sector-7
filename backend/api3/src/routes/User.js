import express from 'express';
const express = require('express');
const { pool } = require('../config/db');
const { pool } = require('../../../db');
const userController = require('../controllers/userController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
import pool from '../../../db.js';import authenticateToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

 // Asumo que tienes una conexión a la DB aquí
const bcrypt = require('bcryptjs');

class User {
    static async findByUsername(username) {
        try {
            const [rows] = await pool.query('SELECT id, username, password_hash, rol, activo FROM usuarios WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            console.error('Error al buscar usuario por nombre de usuario (modelo):', error);
            throw error;
        }
    }

    static async create(username, password_hash, rol) {
        try {
            const finalRol = rol || 'usuario'; // Default role if not provided
            const [result] = await pool.query(
                'INSERT INTO usuarios (username, password_hash, rol, activo, creado_en, actualizado_en) VALUES (?, ?, ?, TRUE, NOW(), NOW())',
                [username, password_hash, finalRol]
            );
            return { id: result.insertId, username, rol: finalRol };
        } catch (error) {
            console.error('Error al crear nuevo usuario en la base de datos (modelo):', error);
            throw error;
        }
    }

    // NEW: Method to find all users (needed for GestionUsuarios.tsx)
    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios');
            return rows;
        } catch (error) {
            console.error('Error al obtener todos los usuarios (modelo):', error);
            throw error;
        }
    }

    // NEW: Method to update a user
    static async update(id, username, rol, activo) {
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET username = ?, rol = ?, activo = ?, actualizado_en = NOW() WHERE id = ?',
                [username, rol, activo, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar usuario (modelo):', error);
            throw error;
        }
    }

    // NEW: Method to delete a user
    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar usuario (modelo):', error);
            throw error;
        }
    }

    // NEW: Method to toggle user status
    static async toggleStatus(id, newStatus) {
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET activo = ?, actualizado_en = NOW() WHERE id = ?',
                [newStatus, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al cambiar estado de usuario (modelo):', error);
            throw error;
        }
    }
}


module.exports = User;
export default User;