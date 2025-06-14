const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// 📋 LISTAR USUÁRIOS (apenas admins)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { unit, status, role, search, limit } = req.query;
        
        const filters = {};
        if (unit) filters.unit = unit;
        if (status) filters.status = status;
        if (role) filters.role = role;
        if (search) filters.search = search;
        if (limit) filters.limit = limit;

        const users = await User.findAll(filters);
        
        await logAudit(req.user.userId, 'LIST_USERS', 'users', {
            filters,
            count: users.length
        });

        res.json({
            success: true,
            data: users.map(user => user.toJSON()),
            count: users.length
        });

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 👤 OBTER USUÁRIO POR ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Usuários comuns só podem ver próprio perfil
        if (req.user.unit !== 'administrador' && req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            data: user.toJSON()
        });

    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ➕ CRIAR USUÁRIO (apenas admins)
router.post('/', authenticateToken, requireAdmin, [
    body('email').isEmail().normalizeEmail(),
    body('name').isLength({ min: 2 }).trim(),
    body('unit').isLength({ min: 1 }),
    body('role').isLength({ min: 1 }),
    body('password').isLength({ min: 6 }),
    body('permissions').isArray()
], async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }

        const { email, name, unit, role, password, permissions } = req.body;

        // Verificar se email já existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Este e-mail já está cadastrado'
            });
        }

        // Criar novo usuário
        const hashedPassword = await User.hashPassword(password);
        const newUser = new User({
            email,
            name,
            unit,
            role,
            password_hash: hashedPassword,
            permissions,
            status: 'active'
        });

        const result = await newUser.save();
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar usuário'
            });
        }

        await logAudit(req.user.userId, 'CREATE_USER', 'users', {
            newUserId: newUser.id,
            email: newUser.email,
            unit: newUser.unit,
            role: newUser.role
        });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: newUser.toJSON()
        });

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// ✏️ ATUALIZAR USUÁRIO
router.put('/:id', authenticateToken, [
    body('name').optional().isLength({ min: 2 }).trim(),
    body('unit').optional().isLength({ min: 1 }),
    body('role').optional().isLength({ min: 1 }),
    body('password').optional().isLength({ min: 6 }),
    body('permissions').optional().isArray(),
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar permissões
        const isAdmin = req.user.unit === 'administrador';
        const isOwnProfile = req.user.userId === id;
        
        if (!isAdmin && !isOwnProfile) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
        }

        const updateData = req.body;
        
        // Usuários comuns não podem alterar certas informações
        if (!isAdmin) {
            delete updateData.unit;
            delete updateData.role;
            delete updateData.permissions;
            delete updateData.status;
        }

        const result = await User.update(id, updateData);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'Erro ao atualizar usuário'
            });
        }

        await logAudit(req.user.userId, 'UPDATE_USER', 'users', {
            targetUserId: id,
            updatedFields: Object.keys(updateData),
            isOwnProfile
        });

        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 🗑️ DESATIVAR USUÁRIO (apenas admins)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Não permitir desativar própria conta
        if (req.user.userId === id) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível desativar sua própria conta'
            });
        }

        const result = await User.delete(id);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao desativar usuário'
            });
        }

        await logAudit(req.user.userId, 'DELETE_USER', 'users', {
            targetUserId: id
        });

        res.json({
            success: true,
            message: 'Usuário desativado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao desativar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 🔄 ATIVAR USUÁRIO (apenas admins)
router.patch('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await User.update(id, { status: 'active' });
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao ativar usuário'
            });
        }

        await logAudit(req.user.userId, 'ACTIVATE_USER', 'users', {
            targetUserId: id
        });

        res.json({
            success: true,
            message: 'Usuário ativado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao ativar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 🔑 REDEFINIR SENHA (apenas admins)
router.patch('/:id/reset-password', authenticateToken, requireAdmin, [
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }

        const result = await User.update(id, { password });
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao redefinir senha'
            });
        }

        await logAudit(req.user.userId, 'RESET_PASSWORD', 'users', {
            targetUserId: id
        });

        res.json({
            success: true,
            message: 'Senha redefinida com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao redefinir senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 📊 ESTATÍSTICAS DE USUÁRIOS (apenas admins)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await User.getStats();
        
        if (!stats) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas'
            });
        }

        await logAudit(req.user.userId, 'VIEW_STATS', 'users', {});

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router; 