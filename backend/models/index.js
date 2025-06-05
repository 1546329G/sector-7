import { Sequelize, DataTypes } from 'sequelize';
import ProfesorModel from './Profesor.js';
import AsistenciaModel from './Asistencia.js';
import HorarioModel from './Horario.js';


const sequelize = new Sequelize('railway', 'root', 'DGiFGWeayPZVQGshUykwPIRDnXifBSsd', {
  host: 'shuttle.proxy.rlwy.net',
  port: 20748,
  dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Profesor = ProfesorModel(sequelize, DataTypes);
db.Asistencia = AsistenciaModel(sequelize, DataTypes);
db.Horario = HorarioModel(sequelize, DataTypes);

// Relaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;