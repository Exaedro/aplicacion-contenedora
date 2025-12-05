import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../index.js';

export class User extends Model { }

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nombres: {
            type: DataTypes.STRING(80),
            allowNull: false,
            validate: { len: [2, 80] },
        },
        apellidos: {
            type: DataTypes.STRING(80),
            allowNull: false,
            validate: { len: [2, 80] },
        },
        email: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        rol: {
            type: DataTypes.ENUM('admin', 'preceptor', 'alumno', 'profesor'),
            allowNull: false,
            defaultValue: 'alumno',
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'usuarios',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        // No usar paranoid porque la tabla del servidor principal puede no tener deleted_at
        // o puede tener una estructura diferente
        paranoid: false,
        freezeTableName: true
    }
);


