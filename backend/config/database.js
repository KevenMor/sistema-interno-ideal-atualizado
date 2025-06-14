const mysql = require('mysql2/promise');
require('dotenv').config();

// 🔐 CONFIGURAÇÃO DO BANCO DE DADOS
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_ideal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// 🔍 TESTAR CONEXÃO
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
        console.log(`📊 Banco: ${dbConfig.database} | Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com o banco de dados:', error.message);
        return false;
    }
}

// 🔧 EXECUTAR QUERY
async function executeQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('❌ Erro ao executar query:', error.message);
        return { success: false, error: error.message };
    }
}

// 🔧 EXECUTAR MÚLTIPLAS QUERIES (TRANSAÇÃO)
async function executeTransaction(queries) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { sql, params } of queries) {
            const [rows] = await connection.execute(sql, params);
            results.push(rows);
        }
        
        await connection.commit();
        return { success: true, data: results };
    } catch (error) {
        await connection.rollback();
        console.error('❌ Erro na transação:', error.message);
        return { success: false, error: error.message };
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction
}; 