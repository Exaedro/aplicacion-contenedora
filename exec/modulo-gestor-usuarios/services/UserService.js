const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
    async getAll(page = 1, limit = 5, search = '') {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM usuarios';
        let countQuery = 'SELECT COUNT(*) as total FROM usuarios';
        const params = [];

        if (search) {
            const searchTerm = `%${search}%`;
            const whereClause = ' WHERE nombres LIKE ? OR apellidos LIKE ? OR email LIKE ? OR id LIKE ? OR rol LIKE ?';
            query += whereClause;
            countQuery += whereClause;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(query, params);
        
        // For count query, we need to use the same params but without limit/offset
        const countParams = search ? [params[0], params[1], params[2], params[3], params[4]] : [];
        const [countRows] = await db.query(countQuery, countParams);
        
        return {
            users: rows,
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRows[0].total / limit)
        };
    }

    async getById(id) {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        return rows[0];
    }

    async updateRole(id, newRole) {
        // Check if user exists first
        const user = await this.getById(id);
        if (!user) return null;

        await db.query('UPDATE usuarios SET rol = ? WHERE id = ?', [newRole, id]);
        return this.getById(id);
    }

    async updatePassword(id, newPassword) {
        // Check if user exists first
        const user = await this.getById(id);
        if (!user) return null;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
        return this.getById(id);
    }
}

module.exports = new UserService();
