const { executeQuery } = require('../config/database');

// 📊 REGISTRAR LOG DE AUDITORIA
async function logAudit(userId, action, resource, details = {}, req = null) {
    try {
        const auditData = {
            user_id: userId,
            action: action,
            resource: resource,
            details: JSON.stringify(details),
            ip_address: req ? (req.ip || req.connection.remoteAddress) : null,
            user_agent: req ? req.get('User-Agent') : null
        };

        const sql = `
            INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            auditData.user_id,
            auditData.action,
            auditData.resource,
            auditData.details,
            auditData.ip_address,
            auditData.user_agent
        ];

        await executeQuery(sql, params);
        
        // Log no console para desenvolvimento
        console.log(`📊 AUDIT: ${action} | User: ${userId || 'anonymous'} | Resource: ${resource}`);
        
    } catch (error) {
        console.error('❌ Erro ao registrar log de auditoria:', error);
        // Não falhar a operação principal por causa do log
    }
}

// 🔍 MIDDLEWARE PARA AUDITORIA AUTOMÁTICA
const auditMiddleware = (action, resource) => {
    return (req, res, next) => {
        // Interceptar resposta para capturar resultado
        const originalSend = res.send;
        
        res.send = function(data) {
            // Registrar log após resposta
            setImmediate(async () => {
                try {
                    const responseData = typeof data === 'string' ? JSON.parse(data) : data;
                    const success = responseData.success !== false;
                    
                    await logAudit(
                        req.user?.userId || null,
                        action,
                        resource,
                        {
                            method: req.method,
                            url: req.originalUrl,
                            params: req.params,
                            query: req.query,
                            success: success,
                            statusCode: res.statusCode
                        },
                        req
                    );
                } catch (error) {
                    console.error('❌ Erro no middleware de auditoria:', error);
                }
            });
            
            // Chamar método original
            originalSend.call(this, data);
        };
        
        next();
    };
};

// 📋 OBTER LOGS DE AUDITORIA
async function getAuditLogs(filters = {}) {
    try {
        let sql = `
            SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];

        // Filtros
        if (filters.userId) {
            sql += ' AND al.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            sql += ' AND al.action = ?';
            params.push(filters.action);
        }

        if (filters.resource) {
            sql += ' AND al.resource = ?';
            params.push(filters.resource);
        }

        if (filters.dateFrom) {
            sql += ' AND al.created_at >= ?';
            params.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            sql += ' AND al.created_at <= ?';
            params.push(filters.dateTo);
        }

        if (filters.ipAddress) {
            sql += ' AND al.ip_address = ?';
            params.push(filters.ipAddress);
        }

        // Ordenação
        sql += ' ORDER BY al.created_at DESC';

        // Limite
        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const result = await executeQuery(sql, params);
        
        if (result.success) {
            return result.data.map(log => ({
                ...log,
                details: JSON.parse(log.details || '{}')
            }));
        }

        return [];
    } catch (error) {
        console.error('❌ Erro ao obter logs de auditoria:', error);
        return [];
    }
}

// 📊 ESTATÍSTICAS DE AUDITORIA
async function getAuditStats(filters = {}) {
    try {
        const queries = [
            // Total de logs
            'SELECT COUNT(*) as total FROM audit_logs',
            
            // Logs por ação
            'SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10',
            
            // Logs por usuário (top 10)
            `SELECT 
                u.name, 
                u.email, 
                COUNT(*) as count 
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE al.user_id IS NOT NULL 
             GROUP BY al.user_id 
             ORDER BY count DESC 
             LIMIT 10`,
            
            // Logs por dia (últimos 7 dias)
            `SELECT 
                DATE(created_at) as date, 
                COUNT(*) as count 
             FROM audit_logs 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
             GROUP BY DATE(created_at) 
             ORDER BY date DESC`
        ];

        const results = await Promise.all(
            queries.map(query => executeQuery(query))
        );

        return {
            total: results[0].data[0]?.total || 0,
            byAction: results[1].data || [],
            byUser: results[2].data || [],
            byDay: results[3].data || []
        };
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas de auditoria:', error);
        return null;
    }
}

// 🧹 LIMPAR LOGS ANTIGOS
async function cleanOldLogs(daysToKeep = 90) {
    try {
        const sql = 'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
        const result = await executeQuery(sql, [daysToKeep]);
        
        if (result.success) {
            console.log(`🧹 Logs de auditoria limpos: ${result.data.affectedRows} registros removidos`);
            return result.data.affectedRows;
        }
        
        return 0;
    } catch (error) {
        console.error('❌ Erro ao limpar logs antigos:', error);
        return 0;
    }
}

module.exports = {
    logAudit,
    auditMiddleware,
    getAuditLogs,
    getAuditStats,
    cleanOldLogs
}; 