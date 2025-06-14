# Sistema Interno Ideal - Gestão de Usuários

Este projeto é um sistema interno para a Autoescola Ideal, integrado com Firebase e Google Sheets, que permite gerenciar usuários, contas BTG, cobranças e extratos.

## 🚀 Tecnologias

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Banco de Dados:** Firebase (Firestore)
- **Autenticação:** JWT (JSON Web Tokens)
- **Integração:** Google Sheets API

## 📋 Funcionalidades

- **Login seguro** com autenticação JWT
- **Gestão de usuários** (cadastro, edição, ativação/desativação)
- **Controle de permissões** por unidade e função
- **Integração com Google Sheets** para extratos e dados financeiros
- **Envio de mensagens** via webhook (Make.com)

## 🛠️ Como Usar

### Pré-requisitos

- Node.js (v14 ou superior)
- Conta no Firebase
- Credenciais do Google Sheets API

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/sistema-interno-ideal.git
   cd sistema-interno-ideal
   ```

2. Instale as dependências do backend:
   ```bash
   cd backend-firebase
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Preencha as variáveis com suas credenciais

4. Inicie o backend:
   ```bash
   node server.js
   ```

5. Acesse o frontend:
   - Abra `index.html` em seu navegador
   - Ou use um servidor local (ex: `npx http-server`)

### Login Inicial

- **Email:** `admin@autoescolaideal.com`
- **Senha:** `admin123`
- **Unidade:** `Administrador`

## 🔐 Segurança

- Autenticação via JWT
- Controle de permissões por unidade
- Proteção de rotas no backend
- Validação de dados no frontend e backend

## 📦 Estrutura do Projeto

```
/sistema-interno-ideal
  ├── backend-firebase/
  │   ├── server.js
  │   ├── models/
  │   ├── package.json
  │   ├── .env.example
  │   └── .gitignore
  ├── frontend/
  │   ├── index.html
  │   ├── login.html
  │   ├── script.js
  │   ├── style.css
  │   └── .gitignore
  └── README.md
```

## 🚀 Deploy

### Backend (Railway)

1. Crie um projeto no Railway
2. Conecte com o repositório do GitHub
3. Configure as variáveis de ambiente
4. Deploy automático

### Frontend (GitHub Pages ou Vercel)

- Suba os arquivos do frontend para o GitHub
- Configure o GitHub Pages ou Vercel para servir os arquivos estáticos

## 📝 Licença

Este projeto é privado e de uso exclusivo da Autoescola Ideal.

## 👥 Contato

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento.

---

Desenvolvido com ❤️ pela equipe da Autoescola Ideal. 