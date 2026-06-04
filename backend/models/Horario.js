export default (sequelize, DataTypes) => {
  const Horario = sequelize.define('Horario', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    id_profesor: {
      type: DataTypes.INTEGER
    },
    hora_entrada: {
      type: DataTypes.TIME
    },
    hora_salida: {
      type: DataTypes.TIME
    },
    dia_semana: {
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
    }
  }, {
    tableName: 'horario',
    timestamps: false
  });

  Horario.associate = (models) => {
    Horario.belongsTo(models.Profesor, { foreignKey: 'id_profesor' });
  };

  return Horario;
};
