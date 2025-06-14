# 🔐 Sistema de Gestão de Usuários - Autoescola Ideal

## Visão Geral

O sistema agora possui um **painel completo de gestão de usuários** que permite:

- ✅ **Cadastrar novos usuários** com unidades específicas
- ✅ **Definir permissões** individuais para cada usuário
- ✅ **Controlar acesso** baseado em email + unidade
- ✅ **Gerenciar status** (ativo/inativo) dos usuários
- ✅ **Painel administrativo** exclusivo para gestores

---

## 🚀 Como Usar

### **1. Login Inicial (Administrador Padrão)**

**Credenciais padrão:**
- **Email:** `admin@autoescolaideal.com`
- **Senha:** `admin123`
- **Unidade:** `🔐 Administrador (Acesso Total)`

### **2. Acessar o Painel de Gestão**

1. Faça login como administrador
2. A aba **"Gestão de Usuários"** aparecerá automaticamente
3. Clique na aba para acessar o painel

### **3. Cadastrar Novos Usuários**

**Campos obrigatórios:**
- **E-mail:** Email único do usuário
- **Nome Completo:** Nome para identificação
- **Unidade de Acesso:** Qual unidade o usuário pode acessar
- **Função/Cargo:** Tipo de função no sistema
- **Permissões:** Quais funcionalidades pode usar
- **Senha Temporária:** Senha inicial (usuário deve alterar)

**Exemplo de cadastro:**
```
Email: joao@autoescolaideal.com
Nome: João Silva
Unidade: Vila Helena
Função: Operador
Permissões: ☑️ Cadastrar Contas BTG, ☑️ Registrar Cobranças
Senha: temp123
```

---

## 🔒 Tipos de Acesso

### **🔐 Administrador**
- **Acesso:** Todas as unidades
- **Permissões:** Todas as funcionalidades
- **Pode:** Gerenciar outros usuários
- **Vê:** Dados de todas as unidades

### **👤 Usuário Comum**
- **Acesso:** Apenas sua unidade específica
- **Permissões:** Conforme definido no cadastro
- **Não pode:** Gerenciar usuários
- **Vê:** Apenas dados da sua unidade

---

## 📋 Permissões Disponíveis

| Permissão | Descrição |
|-----------|-----------|
| **Cadastrar Contas BTG** | Acesso à aba de cadastro de contas |
| **Registrar Cobranças** | Acesso à aba de registro de cobranças |
| **Consultar Extratos** | Acesso à aba de consulta de extratos |
| **Enviar Mensagens** | Acesso à aba de envio de mensagens |
| **Gerenciar Usuários** | Acesso ao painel de gestão (apenas admins) |

---

## 🏢 Unidades Disponíveis

- **🔐 Administrador** - Acesso total
- **Aparecidinha**
- **Coop**
- **Julio de Mesquita**
- **Vila Haro**
- **Vila Helena**
- **Vila Progresso**

---

## 👥 Gerenciamento de Usuários

### **Ações Disponíveis:**

1. **✏️ Editar** - Modificar dados do usuário
2. **🔑 Redefinir Senha** - Alterar senha temporária
3. **❌ Desativar** - Bloquear acesso do usuário
4. **✅ Ativar** - Reativar usuário bloqueado

### **Busca e Filtros:**
- Buscar por nome, email, unidade ou função
- Visualizar status (ativo/inativo)
- Ver último acesso de cada usuário

---

## 🔐 Segurança Implementada

### **Validações de Login:**
1. **Email + Senha** devem estar corretos
2. **Unidade selecionada** deve corresponder à unidade do usuário
3. **Status ativo** é obrigatório para login
4. **Último acesso** é registrado automaticamente

### **Restrições por Unidade:**
- Usuários comuns só veem dados da própria unidade
- Campos de unidade ficam travados para usuários comuns
- Administradores têm acesso irrestrito

### **Controle de Permissões:**
- Cada funcionalidade verifica permissões individuais
- Aba de gestão só aparece para administradores
- Sistema bloqueia ações não autorizadas

---

## 📱 Exemplos Práticos

### **Cenário 1: Operador da Vila Helena**
```
Login: operador.vh@autoescolaideal.com
Unidade: Vila Helena
Permissões: Cadastrar Contas, Registrar Cobranças
Resultado: Só vê dados da Vila Helena, campos travados
```

### **Cenário 2: Gerente Financeiro**
```
Login: financeiro@autoescolaideal.com
Unidade: Coop
Permissões: Todas exceto Gerenciar Usuários
Resultado: Acesso total à unidade Coop, sem gestão de usuários
```

### **Cenário 3: Administrador Geral**
```
Login: admin@autoescolaideal.com
Unidade: Administrador
Permissões: Todas
Resultado: Acesso total, pode gerenciar usuários, vê todas as unidades
```

---

## 🚨 Importante

1. **Senhas:** Em produção, implementar hash de senhas
2. **Backup:** Dados ficam no localStorage do navegador
3. **Primeiro Login:** Usuário deve alterar senha temporária
4. **Admin Padrão:** Altere a senha do administrador padrão
5. **Permissões:** Revise permissões regularmente

---

## 🛠️ Funcionalidades Futuras

- [ ] Modal de edição completa de usuários
- [ ] Histórico de ações dos usuários
- [ ] Exportação de relatórios de acesso
- [ ] Integração com banco de dados
- [ ] Sistema de recuperação de senha
- [ ] Logs de auditoria detalhados

---

**Sistema desenvolvido para Autoescola Ideal**  
*Versão 2.0 - Sistema de Gestão de Usuários* 