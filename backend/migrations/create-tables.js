const { executeQuery, testConnection } = require('../config/database');

// 🗃️ SCRIPT DE CRIAÇÃO DAS TABELAS
async function createTables() {
    console.log('🚀 Iniciando criação das tabelas...');
    
    // Testar conexão primeiro
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Não foi possível conectar ao banco de dados');
        process.exit(1);
    }

    try {
        // 👥 TABELA DE USUÁRIOS
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                unit VARCHAR(100) NOT NULL,
                role VARCHAR(100) NOT NULL,
                permissions JSON,
                status ENUM('active', 'inactive') DEFAULT 'active',
                failed_login_attempts INT DEFAULT 0,
                locked_until DATETIME NULL,
                last_access DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_email (email),
                INDEX idx_unit (unit),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // 🔐 TABELA DE SESSÕES/TOKENS
        const createSessionsTable = `
            CREATE TABLE IF NOT EXISTS user_sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at),
                INDEX idx_token_hash (token_hash)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // 📊 TABELA DE LOGS DE AUDITORIA
        const createAuditLogsTable = `
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36),
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(100),
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // 🏢 TABELA DE UNIDADES
        const createUnitsTable = `
            CREATE TABLE IF NOT EXISTS units (
                id VARCHAR(36) PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                phone VARCHAR(20),
                email VARCHAR(255),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_code (code),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        // Executar criação das tabelas
        console.log('📋 Criando tabela de usuários...');
        await executeQuery(createUsersTable);
        
        console.log('🔐 Criando tabela de sessões...');
        await executeQuery(createSessionsTable);
        
        console.log('📊 Criando tabela de logs de auditoria...');
        await executeQuery(createAuditLogsTable);
        
        console.log('🏢 Criando tabela de unidades...');
        await executeQuery(createUnitsTable);

        // Inserir dados iniciais
        await insertInitialData();

        console.log('✅ Todas as tabelas foram criadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        process.exit(1);
    }
}

// 📝 INSERIR DADOS INICIAIS
async function insertInitialData() {
    console.log('📝 Inserindo dados iniciais...');
    
    // Inserir unidades
    const units = [
        { id: 'admin-unit', code: 'administrador', name: 'Administração Geral' },
        { id: 'aparecidinha-unit', code: 'aparecidinha', name: 'Aparecidinha' },
        { id: 'coop-unit', code: 'coop', name: 'Coop' },
        { id: 'julio-unit', code: 'julio de mesquita', name: 'Julio de Mesquita' },
        { id: 'vila-haro-unit', code: 'vila haro', name: 'Vila Haro' },
        { id: 'vila-helena-unit', code: 'vila helena', name: 'Vila Helena' },
        { id: 'vila-progresso-unit', code: 'vila progresso', name: 'Vila Progresso' }
    ];

    for (const unit of units) {
        const checkUnit = await executeQuery('SELECT id FROM units WHERE code = ?', [unit.code]);
        if (checkUnit.data.length === 0) {
            await executeQuery(
                'INSERT INTO units (id, code, name) VALUES (?, ?, ?)',
                [unit.id, unit.code, unit.name]
            );
            console.log(`✅ Unidade criada: ${unit.name}`);
        }
    }

    // Inserir usuário administrador padrão
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const checkAdmin = await executeQuery('SELECT id FROM users WHERE email = ?', ['admin@autoescolaideal.com']);
    if (checkAdmin.data.length === 0) {
        await executeQuery(`
            INSERT INTO users (id, email, name, password_hash, unit, role, permissions) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'admin-user-001',
            'admin@autoescolaideal.com',
            'Administrador do Sistema',
            adminPassword,
            'administrador',
            'administrador',
            JSON.stringify(['cadastrar_contas', 'registrar_cobranca', 'consultar_extratos', 'enviar_mensagens', 'gerenciar_usuarios'])
        ]);
        console.log('✅ Usuário administrador criado');
        console.log('📧 Email: admin@autoescolaideal.com');
        console.log('🔑 Senha: admin123');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createTables().then(() => {
        console.log('🎉 Migração concluída com sucesso!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    });
}

module.exports = { createTables }; 