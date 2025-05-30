require('dotenv').config(); // Asegúrate de que esto esté al principio
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { testDbConnection } = require('./config/database'); // Importa la función de prueba de conexión

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Prueba la conexión a la base de datos al iniciar la aplicación
testDbConnection();

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Autenticación funcionando!');
});

module.exports = app; // Exporta la instancia de app para que server.js la use