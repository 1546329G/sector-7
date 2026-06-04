export default(sequelize, DataTypes) => {
  const Asistencia = sequelize.define('Asistencia', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    id_profesor: {
      type: DataTypes.INTEGER
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    horas: {
      type: DataTypes.TIME
    },
    tardanza: {
      type: DataTypes.STRING
    },
    justificacion: {
      type: DataTypes.TEXT
    },
    estado: {
      type: DataTypes.STRING
    },
    fecha_registro: {
      type: DataTypes.DATE
    },
    fecha_modificacion: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'asistencia',
    timestamps: false
  });

  Asistencia.associate = (models) => {
    Asistencia.belongsTo(models.Profesor, { foreignKey: 'id_profesor' });
  };

  return Asistencia;
};
