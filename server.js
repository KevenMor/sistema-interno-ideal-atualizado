const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (seu sistema atual)
app.use(express.static(__dirname));

// Rotas principais do sistema atual
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// INTEGRAÇÃO DO MÓDULO DE EXTRATOS
// ================================

let extratoRoutes = null;

try {
  // Tentar importar módulo de extratos
  const createExtratoRoutes = require('./modules/extrato-routes');
  
  // Configurar caminhos dos arquivos de configuração
  const credentialsPath = path.join(__dirname, 'config', 'credentials.json');
  const configPath = path.join(__dirname, 'config', 'planilhas.json');

  // Verificar se arquivos existem
  const fs = require('fs');
  
  if (fs.existsSync(configPath)) {
    // Verificar se temos credenciais (arquivo local ou variável de ambiente)
    let hasCredentials = false;
    
    if (fs.existsSync(credentialsPath)) {
      hasCredentials = true;
    } else if (process.env.GOOGLE_CREDENTIALS) {
      // Criar arquivo temporário a partir da variável de ambiente
      try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        hasCredentials = true;
        console.log('✅ Credenciais carregadas da variável de ambiente');
      } catch (error) {
        console.error('❌ Erro ao processar GOOGLE_CREDENTIALS:', error.message);
      }
    }
    
    if (hasCredentials) {
      // Criar rotas de extrato
      extratoRoutes = createExtratoRoutes(credentialsPath, configPath);
      
      // Integrar as rotas no sistema
      app.use('/api', extratoRoutes);
      
      console.log('✅ Módulo de extratos integrado com sucesso!');
      console.log('📊 API disponível em: /api/extrato');
      console.log('🏢 Unidades em: /api/unidades');
    } else {
      console.log('⚠️  Credenciais não encontradas');
      console.log('💡 Sistema funcionará sem módulo de extratos');
      console.log('📝 Para ativar: configure a variável GOOGLE_CREDENTIALS ou arquivo credentials.json');
    }
  } else {
    console.log('⚠️  Arquivo planilhas.json não encontrado');
    console.log('💡 Sistema funcionará sem módulo de extratos');
  }
  
} catch (error) {
  console.error('⚠️  Erro ao carregar módulo de extratos:', error.message);
  console.log('💡 Sistema funcionará apenas com funcionalidades originais');
}

// APIs de fallback (para quando não há credenciais)
if (!extratoRoutes) {
  app.get('/api/health', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Módulo de extratos não configurado',
      status: 'CONFIGURACAO_PENDENTE',
      detalhes: {
        credenciais: 'Arquivo credentials.json necessário',
        configuracao: 'Arquivo planilhas.json necessário'
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.get('/api/extrato', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Módulo de extratos não está configurado. Configure as credenciais do Google Sheets.',
      error: 'Credenciais não encontradas'
    });
  });

  app.get('/api/unidades', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Módulo de extratos não está configurado. Configure as credenciais do Google Sheets.',
      error: 'Credenciais não encontradas'
    });
  });
}

// ================================

// Health check geral do sistema
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    sistema: 'Autoescola Ideal - Sistema Interno',
    moduloExtratos: extratoRoutes ? 'ATIVO' : 'INATIVO'
  });
});

// Fallback para SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta', PORT);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  
  if (extratoRoutes) {
    console.log(`📊 API Extratos: http://localhost:${PORT}/api/extrato`);
    console.log(`🏢 API Unidades: http://localhost:${PORT}/api/unidades`);
  } else {
    console.log('💡 Para ativar módulo de extratos, configure:');
    console.log('   1. Configure a variável GOOGLE_CREDENTIALS com seu JSON de credenciais');
    console.log('   2. Ou copie config/credentials.json.example para config/credentials.json');
    console.log('   3. Reinicie o servidor');
  }
});

module.exports = app; 