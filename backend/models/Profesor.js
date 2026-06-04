export default (sequelize, DataTypes) => {
  const Profesor = sequelize.define('Profesor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    horas_segun_contrato: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.STRING
    },
    fecha_registro: {
      type: DataTypes.DATE
    },
    fecha_modificacion: {
      type: DataTypes.DATE
    },
    id_institucional: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'profesor',
    timestamps: false
  });

  Profesor.associate = (models) => {
    Profesor.hasMany(models.Asistencia, { foreignKey: 'id_profesor' });
    Profesor.hasMany(models.Horario, { foreignKey: 'id_profesor' });
  };

  return Profesor;
};
