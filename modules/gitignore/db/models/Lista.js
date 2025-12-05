import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../index.js';

export class Lista extends Model { }

Lista.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_curso: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cursos',
                key: 'id',
            },
        },
        id_alumno: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: 'Lista',
        tableName: 'listas',
        timestamps: false,
    }
);

