import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../index.js';

export class Curso extends Model { }

Curso.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        anio: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 7 },
        },
        division: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
    },
    {
        sequelize,
        modelName: 'Curso',
        tableName: 'cursos',
        timestamps: false,
    }
);

// Método para obtener el nombre formateado del curso (ej: "1°2")
Curso.prototype.getNombre = function() {
    return `${this.anio}°${this.division}`;
};

