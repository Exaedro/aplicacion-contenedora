import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../index.js';

export class ModulePreference extends Model { }

ModulePreference.init({
    usuario_id: { type: DataTypes.BIGINT, allowNull: false },
    modulo_nombre: { type: DataTypes.STRING(190), allowNull: false },
    estado: { type: DataTypes.ENUM('favorito', 'escondido', 'neutral'), allowNull: false },
    orden: { type: DataTypes.INTEGER, allowNull: true },
}, {
    sequelize,
    tableName: 'preferencias_modulo',
    modelName: 'ModulePreference',
    underscored: true,
});

// Sólo favoritos tienen orden
ModulePreference.addHook('beforeValidate', (rec) => {
    if (rec.state !== 'favorite') rec.orden = null;
});