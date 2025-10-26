import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../index.js';

export class User extends Model { }

User.init(
    {
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
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user',
        }
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'usuarios', // explícito
    }
);
