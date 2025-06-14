# 🔄 Migração Frontend → Backend

## 📋 Resumo da Migração

Seu sistema atual usa **localStorage** (frontend). Agora você tem um **backend seguro** com banco de dados MySQL.

---

## 🚀 Como Configurar

### **1. Instalar Backend**

```bash
# Navegar para pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar banco de dados (.env)
cp env.example .env
# Editar .env com suas configurações MySQL

# Criar tabelas
npm run migrate

# Iniciar servidor
npm run dev
```

### **2. Verificar se Funcionou**

```bash
# Testar API
curl http://localhost:3001/api/health

# Fazer login de teste
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@autoescolaideal.com",
    "password": "admin123",
    "unit": "administrador"
  }'
```

---

## 🔧 Modificações no Frontend

### **1. Substituir UserManager (script.js)**

**❌ ANTES (localStorage):**
```javascript
class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('sistemaUsers')) || [];
    }
    
    validateUser(email, password, unit) {
        // Validação local...
    }
}
```

**✅ DEPOIS (API):**
```javascript
class UserManager {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
    }
    
    async validateUser(email, password, unit) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, unit })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.token = data.token;
                return { success: true, user: data.user, isAdmin: data.isAdmin };
            }
            
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro de conexão com servidor' };
        }
    }
    
    async createUser(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(userData)
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }
    
    async getUsers(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${this.apiUrl}/users?${params}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }
    
    async updateUser(userId, updateData) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updateData)
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }
    
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }
    
    async resetPassword(userId, newPassword) {
        try {
            const response = await fetch(`${this.apiUrl}/users/${userId}/reset-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ password: newPassword })
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }
}
```

### **2. Modificar Login (login.html)**

**❌ ANTES:**
```javascript
function realizarLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const unit = document.getElementById('unidade').value;
    
    const result = userManager.validateUser(email, password, unit);
    // ... resto do código
}
```

**✅ DEPOIS:**
```javascript
async function realizarLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const unit = document.getElementById('unidade').value;
    
    // Mostrar loading
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.textContent = 'Entrando...';
    loginBtn.disabled = true;
    
    try {
        const result = await userManager.validateUser(email, password, unit);
        
        if (result.success) {
            showToast('Login realizado com sucesso!', 'success');
            
            // Salvar dados do usuário
            localStorage.setItem('selectedUnit', unit);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isAdmin', result.isAdmin);
            
            // Redirecionar
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast(result.message || 'Erro no login', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão com o servidor', 'error');
    } finally {
        loginBtn.textContent = 'Entrar';
        loginBtn.disabled = false;
    }
}
```

### **3. Modificar Gestão de Usuários**

**❌ ANTES:**
```javascript
async function carregarUsuarios() {
    const users = userManager.getUsers();
    // ... renderizar lista
}

async function criarUsuario() {
    const userData = getFormData();
    const result = userManager.createUser(userData);
    // ... processar resultado
}
```

**✅ DEPOIS:**
```javascript
async function carregarUsuarios() {
    try {
        const response = await userManager.getUsers();
        
        if (response.success) {
            renderizarListaUsuarios(response.data);
        } else {
            showToast('Erro ao carregar usuários', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function criarUsuario() {
    const userData = getFormData();
    
    try {
        const result = await userManager.createUser(userData);
        
        if (result.success) {
            showToast('Usuário criado com sucesso!', 'success');
            fecharModalUsuario();
            carregarUsuarios(); // Recarregar lista
        } else {
            showToast(result.message || 'Erro ao criar usuário', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}
```

### **4. Adicionar Verificação de Token**

**Adicionar no início do script.js:**
```javascript
// Verificar se token ainda é válido
async function verificarAutenticacao() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            localStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        
        const data = await response.json();
        if (!data.success) {
            localStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
    }
}

// Chamar verificação ao carregar página
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await verificarAutenticacao();
    if (isAuthenticated) {
        // Inicializar aplicação
        inicializarSistema();
    }
});
```

### **5. Adicionar Interceptor para Tokens Expirados**

```javascript
// Interceptar respostas para detectar token expirado
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    if (response.status === 401) {
        const data = await response.json();
        if (data.message === 'Token expirado' || data.message === 'Token inválido') {
            localStorage.clear();
            showToast('Sessão expirada. Faça login novamente.', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
    
    return response;
};
```

---

## 🔄 Processo de Migração Gradual

### **Opção 1: Migração Completa**
1. Configurar backend
2. Modificar todo o frontend
3. Testar tudo
4. Colocar em produção

### **Opção 2: Migração Gradual**
1. Manter sistema atual funcionando
2. Configurar backend em paralelo
3. Migrar funcionalidade por funcionalidade
4. Testar cada parte
5. Substituir completamente

---

## 🔒 Vantagens do Backend

### **Segurança:**
- ✅ Senhas criptografadas (bcrypt)
- ✅ Tokens JWT seguros
- ✅ Rate limiting contra ataques
- ✅ Logs de auditoria completos
- ✅ Validação robusta de dados

### **Confiabilidade:**
- ✅ Dados persistentes no banco
- ✅ Backup automático possível
- ✅ Não perde dados se limpar navegador
- ✅ Controle centralizado de usuários

### **Escalabilidade:**
- ✅ Múltiplos usuários simultâneos
- ✅ API pode ser usada por outros sistemas
- ✅ Fácil integração com outros serviços
- ✅ Monitoramento e métricas

---

## 🚨 Pontos de Atenção

### **1. CORS**
Se frontend e backend estiverem em domínios diferentes, configurar CORS no backend.

### **2. HTTPS em Produção**
Sempre usar HTTPS em produção para proteger tokens JWT.

### **3. Backup do Banco**
Configurar backup automático do MySQL.

### **4. Monitoramento**
Implementar logs e alertas para monitorar a API.

---

## 📞 Suporte na Migração

Se precisar de ajuda durante a migração:

1. **Testar backend:** `curl http://localhost:3001/api/health`
2. **Verificar logs:** Console do servidor mostra erros
3. **Testar login:** Usar credenciais padrão do admin
4. **Verificar token:** Usar ferramentas como Postman

---

**🎉 Com essa migração, seu sistema ficará muito mais seguro e profissional!** 