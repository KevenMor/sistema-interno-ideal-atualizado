const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso requerido'
            });
        }

        // Verificar e decodificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuário no banco para verificar se ainda está ativo
        const user = await User.findById(decoded.userId);
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou usuário inativo'
            });
        }

        // Adicionar informações do usuário à requisição
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            unit: decoded.unit,
            role: decoded.role,
            permissions: decoded.permissions
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        console.error('❌ Erro na autenticação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// 🔐 MIDDLEWARE PARA VERIFICAR SE É ADMINISTRADOR
const requireAdmin = (req, res, next) => {
    if (req.user.unit !== 'administrador') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Apenas administradores podem realizar esta ação.'
        });
    }
    next();
};

// 🔐 MIDDLEWARE PARA VERIFICAR PERMISSÕES ESPECÍFICAS
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (req.user.unit === 'administrador') {
            // Administradores têm todas as permissões
            return next();
        }

        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: `Acesso negado. Permissão requerida: ${permission}`
            });
        }
        next();
    };
};

// 🔐 MIDDLEWARE PARA VERIFICAR ACESSO À UNIDADE
const requireUnitAccess = (req, res, next) => {
    const requestedUnit = req.params.unit || req.body.unit || req.query.unit;
    
    // Administradores têm acesso a todas as unidades
    if (req.user.unit === 'administrador') {
        return next();
    }

    // Usuários comuns só podem acessar sua própria unidade
    if (requestedUnit && requestedUnit !== req.user.unit) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você só pode acessar dados da sua unidade.'
        });
    }

    next();
};

// 🔐 MIDDLEWARE PARA VERIFICAR SE USUÁRIO PODE ACESSAR RECURSO
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        const targetUserId = req.params[userIdParam] || req.body[userIdParam];
        
        // Administradores podem acessar qualquer recurso
        if (req.user.unit === 'administrador') {
            return next();
        }

        // Usuários só podem acessar seus próprios recursos
        if (targetUserId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Você só pode acessar seus próprios dados.'
            });
        }

        next();
    };
};

// 🔐 MIDDLEWARE PARA RATE LIMITING POR USUÁRIO
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user.userId;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Limpar requisições antigas
        if (requests.has(userId)) {
            const userRequests = requests.get(userId).filter(time => time > windowStart);
            requests.set(userId, userRequests);
        } else {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);

        // Verificar se excedeu o limite
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Muitas requisições. Tente novamente em alguns minutos.'
            });
        }

        // Adicionar requisição atual
        userRequests.push(now);
        requests.set(userId, userRequests);

        next();
    };
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePermission,
    requireUnitAccess,
    requireOwnershipOrAdmin,
    userRateLimit
}; 