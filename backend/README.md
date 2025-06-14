# 🔐 Backend - Sistema de Gestão de Usuários

## 📋 Visão Geral

Backend seguro para o Sistema de Gestão de Usuários da Autoescola Ideal, desenvolvido com Node.js, Express e MySQL.

### 🚀 Funcionalidades

- ✅ **Autenticação JWT** com tokens seguros
- ✅ **Senhas criptografadas** com bcrypt
- ✅ **Controle de acesso** por unidade e permissões
- ✅ **Logs de auditoria** completos
- ✅ **Rate limiting** para proteção contra ataques
- ✅ **Validação de dados** robusta
- ✅ **API RESTful** bem estruturada

---

## 🛠️ Instalação e Configuração

### **1. Pré-requisitos**

- **Node.js** 16+ 
- **MySQL** 8.0+
- **npm** ou **yarn**

### **2. Instalação**

```bash
# Navegar para pasta do backend
cd backend

# Instalar dependências
npm install

# Ou com yarn
yarn install
```

### **3. Configuração do Banco de Dados**

**Criar banco de dados:**
```sql
CREATE DATABASE sistema_ideal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Configurar usuário (opcional):**
```sql
CREATE USER 'sistema_user'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON sistema_ideal.* TO 'sistema_user'@'localhost';
FLUSH PRIVILEGES;
```

### **4. Variáveis de Ambiente**

**Copiar arquivo de exemplo:**
```bash
cp env.example .env
```

**Editar arquivo `.env`:**
```env
# 🔐 CONFIGURAÇÕES DO BANCO DE DADOS
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_ideal
DB_USER=root
DB_PASSWORD=sua_senha_mysql

# 🔑 CONFIGURAÇÕES DE SEGURANÇA
JWT_SECRET=sua_chave_secreta_super_forte_aqui_123456789
JWT_EXPIRES_IN=24h

# 🌐 CONFIGURAÇÕES DO SERVIDOR
PORT=3001
NODE_ENV=development

# 🔒 CONFIGURAÇÕES DE SEGURANÇA ADICIONAL
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15
```

### **5. Criar Tabelas**

```bash
# Executar migração
npm run migrate
```

---

## 🚀 Execução

### **Desenvolvimento:**
```bash
npm run dev
```

### **Produção:**
```bash
npm start
```

### **Verificar se está funcionando:**
```bash
curl http://localhost:3001/api/health
```

---

## 📡 Endpoints da API

### **🔐 Autenticação (`/api/auth`)**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/login` | Fazer login |
| `POST` | `/refresh` | Renovar token |
| `POST` | `/logout` | Fazer logout |
| `GET` | `/verify` | Verificar token |

**Exemplo de Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@autoescolaideal.com",
    "password": "admin123",
    "unit": "administrador"
  }'
```

### **👥 Usuários (`/api/users`)**

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/` | Listar usuários | Admin |
| `GET` | `/:id` | Obter usuário | Admin/Próprio |
| `POST` | `/` | Criar usuário | Admin |
| `PUT` | `/:id` | Atualizar usuário | Admin/Próprio |
| `DELETE` | `/:id` | Desativar usuário | Admin |
| `PATCH` | `/:id/activate` | Ativar usuário | Admin |
| `PATCH` | `/:id/reset-password` | Redefinir senha | Admin |
| `GET` | `/stats/overview` | Estatísticas | Admin |

**Exemplo de Criação de Usuário:**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "email": "operador@autoescolaideal.com",
    "name": "João Silva",
    "unit": "vila helena",
    "role": "operador",
    "password": "senha123",
    "permissions": ["cadastrar_contas", "registrar_cobranca"]
  }'
```

---

## 🔒 Segurança Implementada

### **🔐 Autenticação**
- **JWT Tokens** com expiração configurável
- **Senhas hasheadas** com bcrypt (12 rounds)
- **Bloqueio de conta** após tentativas falhadas
- **Refresh tokens** para renovação segura

### **🛡️ Autorização**
- **Controle por unidade** (usuários só acessam própria unidade)
- **Sistema de permissões** granular
- **Middleware de verificação** em todas as rotas protegidas
- **Validação de propriedade** de recursos

### **🚦 Rate Limiting**
- **Global:** 1000 req/15min por IP
- **Auth:** 10 tentativas/15min por IP
- **Por usuário:** 100 req/15min

### **📊 Auditoria**
- **Logs completos** de todas as ações
- **Rastreamento de IP** e User-Agent
- **Detalhes de operações** em JSON
- **Limpeza automática** de logs antigos

---

## 🗃️ Estrutura do Banco

### **Tabela `users`**
```sql
- id (VARCHAR(36) PRIMARY KEY)
- email (VARCHAR(255) UNIQUE)
- name (VARCHAR(255))
- password_hash (VARCHAR(255))
- unit (VARCHAR(100))
- role (VARCHAR(100))
- permissions (JSON)
- status (ENUM: active/inactive)
- failed_login_attempts (INT)
- locked_until (DATETIME)
- last_access (DATETIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Tabela `audit_logs`**
```sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- user_id (VARCHAR(36))
- action (VARCHAR(100))
- resource (VARCHAR(100))
- details (JSON)
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

---

## 🔧 Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start

# Criar tabelas do banco
npm run migrate

# Executar testes (quando implementados)
npm test
```

---

## 🚨 Credenciais Padrão

**Administrador criado automaticamente:**
- **Email:** `admin@autoescolaideal.com`
- **Senha:** `admin123`
- **Unidade:** `administrador`

⚠️ **IMPORTANTE:** Altere esta senha em produção!

---

## 🔄 Migração do Frontend

Para migrar do sistema atual (localStorage) para o backend:

### **1. Atualizar Frontend**
```javascript
// Substituir localStorage por chamadas à API
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, unit })
});
```

### **2. Gerenciar Tokens**
```javascript
// Salvar token no localStorage
localStorage.setItem('authToken', response.token);

// Usar token nas requisições
fetch('/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📈 Monitoramento

### **Health Check**
```bash
curl http://localhost:3001/api/health
```

### **Logs do Servidor**
```bash
# Ver logs em tempo real
tail -f logs/server.log

# Ou no console durante desenvolvimento
npm run dev
```

### **Estatísticas de Usuários**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/users/stats/overview
```

---

## 🚀 Deploy em Produção

### **1. Configurar Ambiente**
```bash
# Definir variáveis de produção
export NODE_ENV=production
export DB_HOST=seu_host_mysql
export JWT_SECRET=chave_super_secreta_producao
```

### **2. Usar PM2 (recomendado)**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name "sistema-ideal-api"

# Configurar auto-restart
pm2 startup
pm2 save
```

### **3. Nginx (proxy reverso)**
```nginx
server {
    listen 80;
    server_name api.autoescolaideal.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🛠️ Desenvolvimento

### **Estrutura de Pastas**
```
backend/
├── config/          # Configurações (banco, etc)
├── middleware/      # Middlewares (auth, audit, etc)
├── models/          # Modelos de dados
├── routes/          # Rotas da API
├── migrations/      # Scripts de banco
├── logs/           # Arquivos de log
├── server.js       # Servidor principal
└── package.json    # Dependências
```

### **Adicionar Nova Rota**
```javascript
// routes/exemplo.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
    res.json({ message: 'Nova rota!' });
});

module.exports = router;
```

---

## 📞 Suporte

- **Logs de erro:** Verificar console do servidor
- **Problemas de conexão:** Verificar configurações do `.env`
- **Permissões:** Verificar se usuário tem as permissões corretas
- **Performance:** Verificar logs de auditoria para gargalos

---

**Sistema desenvolvido para Autoescola Ideal**  
*Backend API v1.0 - Sistema de Gestão de Usuários* 