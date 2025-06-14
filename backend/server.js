const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configurações e middlewares
const { testConnection } = require('./config/database');
const { logAudit } = require('./middleware/audit');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔒 MIDDLEWARES DE SEGURANÇA
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
    },
}));

// 🌐 CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://seudominio.com'] // Substitua pelo seu domínio
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🚦 RATE LIMITING GLOBAL
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo 1000 requisições por IP
    message: {
        success: false,
        message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(globalLimiter);

// 🚦 RATE LIMITING PARA AUTENTICAÇÃO
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas de login por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    skipSuccessfulRequests: true,
});

// 📝 MIDDLEWARES DE PARSING
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📊 MIDDLEWARE DE LOGGING
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? '❌' : '✅';
        
        console.log(
            `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`
        );
    });
    
    next();
});

// 🏠 ROTA RAIZ
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Sistema Ideal - Gestão de Usuários',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            health: '/api/health'
        }
    });
});

// 🔍 HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbConnected ? 'connected' : 'disconnected',
                server: 'running'
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// 🛣️ ROTAS DA API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);

// 📊 ROTA DE LOGS DE AUDITORIA (apenas para admins)
app.get('/api/audit/logs', async (req, res) => {
    // Esta rota seria protegida por middleware de autenticação
    res.json({
        success: true,
        message: 'Endpoint de auditoria - implementar autenticação'
    });
});

// 🚫 MIDDLEWARE DE ROTA NÃO ENCONTRADA
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// 🚨 MIDDLEWARE DE TRATAMENTO DE ERROS
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error);
    
    // Log do erro para auditoria
    logAudit(req.user?.userId || null, 'ERROR', 'server', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
    }, req);
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 🚀 INICIALIZAR SERVIDOR
async function startServer() {
    try {
        // Testar conexão com banco de dados
        console.log('🔍 Testando conexão com banco de dados...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Não foi possível conectar ao banco de dados');
            console.error('💡 Verifique as configurações no arquivo .env');
            process.exit(1);
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🎉 ===================================');
            console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
            console.log('🎉 ===================================');
            console.log(`📡 Servidor rodando na porta: ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔐 API Auth: http://localhost:${PORT}/api/auth`);
            console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
            console.log(`🛡️ Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('🎉 ===================================');
            
            // Log de inicialização
            logAudit(null, 'SERVER_START', 'server', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// 🛑 GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
    logAudit(null, 'SERVER_SHUTDOWN', 'server', {
        signal: 'SIGTERM',
        timestamp: new Date().toISOString()
    });
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT. Encerrando servidor graciosamente...');
    logAudit(null, 'SERVER_SHUTDOWN', 'server', {
        signal: 'SIGINT',
        timestamp: new Date().toISOString()
    });
    process.exit(0);
});

// Inicializar servidor
startServer();

module.exports = app; 