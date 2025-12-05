import { User } from './User.js';
import { Curso } from './Curso.js';
import { Lista } from './Lista.js';

// Definir relaciones
User.belongsToMany(Curso, {
    through: Lista,
    foreignKey: 'id_alumno',
    otherKey: 'id_curso',
    as: 'cursos'
});

Curso.belongsToMany(User, {
    through: Lista,
    foreignKey: 'id_curso',
    otherKey: 'id_alumno',
    as: 'alumnos'
});

Lista.belongsTo(User, { foreignKey: 'id_alumno', as: 'alumno' });
Lista.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });

export { User, Curso, Lista };

