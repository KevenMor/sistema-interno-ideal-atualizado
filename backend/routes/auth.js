const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { logAudit } = require('../middleware/audit');

const router = express.Router();

// 🔐 LOGIN
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
    body('unit').isLength({ min: 1 })
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

        const { email, password, unit } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        // Buscar usuário
        const user = await User.findByEmail(email);
        if (!user) {
            await logAudit(null, 'LOGIN_FAILED', 'auth', {
                email,
                reason: 'User not found',
                ip: clientIP
            });
            
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Verificar se conta está bloqueada
        if (user.isLocked()) {
            await logAudit(user.id, 'LOGIN_BLOCKED', 'auth', {
                reason: 'Account locked',
                ip: clientIP
            });
            
            return res.status(423).json({
                success: false,
                message: 'Conta temporariamente bloqueada devido a muitas tentativas de login'
            });
        }

        // Verificar senha
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            await user.recordFailedLogin();
            await logAudit(user.id, 'LOGIN_FAILED', 'auth', {
                reason: 'Invalid password',
                ip: clientIP
            });
            
            return res.status(401).json({
                success: false,
                message: 'E-mail ou senha incorretos'
            });
        }

        // Verificar unidade (exceto para administradores)
        if (user.unit !== 'administrador' && user.unit !== unit) {
            await logAudit(user.id, 'LOGIN_FAILED', 'auth', {
                reason: 'Invalid unit',
                requestedUnit: unit,
                userUnit: user.unit,
                ip: clientIP
            });
            
            return res.status(403).json({
                success: false,
                message: `Este usuário só tem acesso à unidade: ${user.unit}`
            });
        }

        // Login bem-sucedido
        await user.recordSuccessfulLogin();

        // Gerar JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                unit: user.unit,
                role: user.role,
                permissions: user.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        await logAudit(user.id, 'LOGIN_SUCCESS', 'auth', {
            unit,
            ip: clientIP,
            userAgent
        });

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            user: user.toJSON(),
            token,
            isAdmin: user.unit === 'administrador'
        });

    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 🔄 REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        // Verificar token atual
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Usuário inválido ou inativo'
            });
        }

        // Gerar novo token
        const newToken = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                unit: user.unit,
                role: user.role,
                permissions: user.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            token: newToken,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('❌ Erro no refresh:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

// 🚪 LOGOUT
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (userId) {
            await logAudit(userId, 'LOGOUT', 'auth', {
                ip: req.ip
            });
        }

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro no logout:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// 🔍 VERIFICAR TOKEN
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.json({
            success: true,
            user: user.toJSON(),
            isAdmin: user.unit === 'administrador'
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

module.exports = router; 