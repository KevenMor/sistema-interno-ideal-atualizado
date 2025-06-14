const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.email = data.email;
        this.name = data.name;
        this.passwordHash = data.password_hash;
        this.unit = data.unit;
        this.role = data.role;
        this.permissions = data.permissions || [];
        this.status = data.status || 'active';
        this.failedLoginAttempts = data.failed_login_attempts || 0;
        this.lockedUntil = data.locked_until;
        this.lastAccess = data.last_access;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    // 🔐 HASH DA SENHA
    static async hashPassword(password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return await bcrypt.hash(password, rounds);
    }

    // 🔍 VERIFICAR SENHA
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.passwordHash);
    }

    // 💾 SALVAR USUÁRIO
    async save() {
        try {
            const sql = `
                INSERT INTO users (id, email, name, password_hash, unit, role, permissions, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    password_hash = VALUES(password_hash),
                    unit = VALUES(unit),
                    role = VALUES(role),
                    permissions = VALUES(permissions),
                    status = VALUES(status),
                    updated_at = CURRENT_TIMESTAMP
            `;

            const params = [
                this.id,
                this.email,
                this.name,
                this.passwordHash,
                this.unit,
                this.role,
                JSON.stringify(this.permissions),
                this.status
            ];

            const result = await executeQuery(sql, params);
            return result;
        } catch (error) {
            console.error('❌ Erro ao salvar usuário:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔍 BUSCAR POR EMAIL
    static async findByEmail(email) {
        try {
            const sql = 'SELECT * FROM users WHERE email = ? AND status = "active"';
            const result = await executeQuery(sql, [email]);
            
            if (result.success && result.data.length > 0) {
                const userData = result.data[0];
                userData.permissions = JSON.parse(userData.permissions || '[]');
                return new User(userData);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário por email:', error);
            return null;
        }
    }

    // 🔍 BUSCAR POR ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM users WHERE id = ?';
            const result = await executeQuery(sql, [id]);
            
            if (result.success && result.data.length > 0) {
                const userData = result.data[0];
                userData.permissions = JSON.parse(userData.permissions || '[]');
                return new User(userData);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário por ID:', error);
            return null;
        }
    }

    // 📋 LISTAR TODOS OS USUÁRIOS
    static async findAll(filters = {}) {
        try {
            let sql = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            // Filtros opcionais
            if (filters.unit) {
                sql += ' AND unit = ?';
                params.push(filters.unit);
            }

            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.role) {
                sql += ' AND role = ?';
                params.push(filters.role);
            }

            if (filters.search) {
                sql += ' AND (name LIKE ? OR email LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            sql += ' ORDER BY created_at DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }

            const result = await executeQuery(sql, params);
            
            if (result.success) {
                return result.data.map(userData => {
                    userData.permissions = JSON.parse(userData.permissions || '[]');
                    return new User(userData);
                });
            }
            
            return [];
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error);
            return [];
        }
    }

    // ✏️ ATUALIZAR USUÁRIO
    static async update(id, updateData) {
        try {
            const fields = [];
            const params = [];

            // Campos que podem ser atualizados
            const allowedFields = ['name', 'unit', 'role', 'permissions', 'status'];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    if (field === 'permissions') {
                        fields.push(`${field} = ?`);
                        params.push(JSON.stringify(updateData[field]));
                    } else {
                        fields.push(`${field} = ?`);
                        params.push(updateData[field]);
                    }
                }
            }

            // Atualizar senha se fornecida
            if (updateData.password) {
                const hashedPassword = await User.hashPassword(updateData.password);
                fields.push('password_hash = ?');
                params.push(hashedPassword);
            }

            if (fields.length === 0) {
                return { success: false, error: 'Nenhum campo para atualizar' };
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            const result = await executeQuery(sql, params);

            return result;
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            return { success: false, error: error.message };
        }
    }

    // 🗑️ DELETAR USUÁRIO (SOFT DELETE)
    static async delete(id) {
        try {
            const sql = 'UPDATE users SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            const result = await executeQuery(sql, [id]);
            return result;
        } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔒 REGISTRAR TENTATIVA DE LOGIN FALHADA
    async recordFailedLogin() {
        try {
            const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
            const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 15; // minutos

            this.failedLoginAttempts += 1;

            let sql = 'UPDATE users SET failed_login_attempts = ?';
            let params = [this.failedLoginAttempts];

            // Se excedeu tentativas, bloquear conta
            if (this.failedLoginAttempts >= maxAttempts) {
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + lockoutTime);
                
                sql += ', locked_until = ?';
                params.push(lockUntil);
                this.lockedUntil = lockUntil;
            }

            sql += ' WHERE id = ?';
            params.push(this.id);

            await executeQuery(sql, params);
        } catch (error) {
            console.error('❌ Erro ao registrar falha de login:', error);
        }
    }

    // ✅ REGISTRAR LOGIN SUCESSO
    async recordSuccessfulLogin() {
        try {
            const sql = `
                UPDATE users SET 
                    failed_login_attempts = 0, 
                    locked_until = NULL, 
                    last_access = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            await executeQuery(sql, [this.id]);
            this.failedLoginAttempts = 0;
            this.lockedUntil = null;
            this.lastAccess = new Date();
        } catch (error) {
            console.error('❌ Erro ao registrar login sucesso:', error);
        }
    }

    // 🔍 VERIFICAR SE CONTA ESTÁ BLOQUEADA
    isLocked() {
        if (!this.lockedUntil) return false;
        return new Date() < new Date(this.lockedUntil);
    }

    // 📊 ESTATÍSTICAS DE USUÁRIOS
    static async getStats() {
        try {
            const queries = [
                'SELECT COUNT(*) as total FROM users',
                'SELECT COUNT(*) as active FROM users WHERE status = "active"',
                'SELECT COUNT(*) as inactive FROM users WHERE status = "inactive"',
                'SELECT unit, COUNT(*) as count FROM users WHERE status = "active" GROUP BY unit'
            ];

            const results = await Promise.all(
                queries.map(query => executeQuery(query))
            );

            return {
                total: results[0].data[0].total,
                active: results[1].data[0].active,
                inactive: results[2].data[0].inactive,
                byUnit: results[3].data
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }

    // 🔄 CONVERTER PARA JSON (sem senha)
    toJSON() {
        const { passwordHash, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User; 