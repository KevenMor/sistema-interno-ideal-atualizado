const express = require('express');
const ExtratoService = require('./extrato-service');

/**
 * Criar rotas para o módulo de extratos
 */
function createExtratoRoutes(credentialsPath, configPath) {
  const router = express.Router();
  
  // Inicializar serviço de extratos
  let extratoService = null;
  
  try {
    extratoService = new ExtratoService(credentialsPath, configPath);
    console.log('✅ Serviço de extratos inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar serviço de extratos:', error.message);
  }

  // Middleware para verificar se o serviço está disponível
  const verificarServico = (req, res, next) => {
    if (!extratoService) {
      return res.status(503).json({
        success: false,
        message: 'Serviço de extratos não disponível',
        error: 'Serviço não foi inicializado corretamente'
      });
    }
    next();
  };

  /**
   * GET /api/extrato - Buscar extratos com filtros
   */
  router.get('/extrato', verificarServico, async (req, res) => {
    try {
      const filtros = {
        unidade: req.query.unidade,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        competencia: req.query.competencia
      };

      // Remover filtros vazios
      Object.keys(filtros).forEach(key => {
        if (!filtros[key] || filtros[key] === '') {
          delete filtros[key];
        }
      });

      console.log('📊 Requisição de extrato recebida:', filtros);

      const resultado = await extratoService.buscarExtratos(filtros);

      res.json({
        success: true,
        data: resultado.dados,
        estatisticas: resultado.estatisticas,
        filtros: resultado.filtros,
        total: resultado.dados.length,
        message: `Dados obtidos com sucesso${filtros.unidade && filtros.unidade !== 'todas' ? ` para a unidade ${filtros.unidade}` : ''}`
      });
    } catch (error) {
      console.error('❌ Erro na rota /extrato:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /api/unidades - Buscar unidades disponíveis
   */
  router.get('/unidades', verificarServico, async (req, res) => {
    try {
      const unidades = extratoService.getUnidades();
      
      console.log('🏢 Requisição de unidades recebida');
      
      res.json({
        success: true,
        data: unidades,
        total: unidades.length,
        message: 'Unidades obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro na rota /unidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /api/extrato/estatisticas - Buscar apenas estatísticas
   */
  router.get('/extrato/estatisticas', verificarServico, async (req, res) => {
    try {
      const filtros = {
        unidade: req.query.unidade,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        competencia: req.query.competencia
      };

      // Remover filtros vazios
      Object.keys(filtros).forEach(key => {
        if (!filtros[key] || filtros[key] === '') {
          delete filtros[key];
        }
      });

      console.log('📈 Requisição de estatísticas recebida:', filtros);

      const resultado = await extratoService.buscarExtratos(filtros);

      res.json({
        success: true,
        estatisticas: resultado.estatisticas,
        filtros: resultado.filtros,
        message: 'Estatísticas obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro na rota /extrato/estatisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  /**
   * GET /api/extrato/exportar - Exportar dados para CSV
   */
  router.get('/extrato/exportar', verificarServico, async (req, res) => {
    try {
      const filtros = {
        unidade: req.query.unidade,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        competencia: req.query.competencia
      };

      // Remover filtros vazios
      Object.keys(filtros).forEach(key => {
        if (!filtros[key] || filtros[key] === '') {
          delete filtros[key];
        }
      });

      console.log('📄 Requisição de exportação recebida:', filtros);

      const resultado = await extratoService.buscarExtratos(filtros);

      // Gerar CSV
      const headers = ['Data de Pagamento', 'Nome do Aluno', 'Forma de Pagamento', 'Valor', 'Unidade', 'Descrição'];
      const csvContent = [
        headers.join(','),
        ...resultado.dados.map(item => 
          headers.map(header => {
            const value = item[header] || '';
            // Escapar aspas e vírgulas
            return value.toString().includes(',') || value.toString().includes('"') 
              ? `"${value.toString().replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Configurar headers para download
      const nomeArquivo = `extrato_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      
      // Adicionar BOM para UTF-8
      res.write('\ufeff');
      res.end(csvContent);

    } catch (error) {
      console.error('❌ Erro na rota /extrato/exportar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar dados',
        error: error.message
      });
    }
  });

  /**
   * GET /api/health - Verificar status do sistema
   */
  router.get('/health', async (req, res) => {
    try {
      let status = 'OK';
      let detalhes = {};

      if (extratoService) {
        detalhes = await extratoService.verificarSaude();
        status = detalhes.status;
      } else {
        status = 'ERRO';
        detalhes = {
          status: 'ERRO',
          erro: 'Serviço não inicializado'
        };
      }

      const responseCode = status === 'OK' ? 200 : 503;

      res.status(responseCode).json({
        success: status === 'OK',
        message: status === 'OK' ? 'Sistema de extratos funcionando' : 'Sistema de extratos com problemas',
        status: status,
        detalhes: detalhes,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('❌ Erro na rota /health:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar status do sistema',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/extrato/filtrar - Buscar extratos com filtros via POST (para filtros complexos)
   */
  router.post('/extrato/filtrar', verificarServico, async (req, res) => {
    try {
      const filtros = req.body;

      console.log('📊 Requisição POST de extrato recebida:', filtros);

      const resultado = await extratoService.buscarExtratos(filtros);

      res.json({
        success: true,
        data: resultado.dados,
        estatisticas: resultado.estatisticas,
        filtros: resultado.filtros,
        total: resultado.dados.length,
        message: 'Dados obtidos com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro na rota POST /extrato/filtrar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  /**
   * Middleware de erro para as rotas
   */
  router.use((error, req, res, next) => {
    console.error('❌ Erro não tratado nas rotas de extrato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createExtratoRoutes; 