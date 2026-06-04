import { Sequelize, DataTypes } from 'sequelize';
import ProfesorModel from './Profesor.js';
import AsistenciaModel from './Asistencia.js';
import HorarioModel from './Horario.js';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Profesor = ProfesorModel(sequelize, DataTypes);
db.Asistencia = AsistenciaModel(sequelize, DataTypes);
db.Horario = HorarioModel(sequelize, DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
