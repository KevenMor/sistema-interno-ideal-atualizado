# 🚀 Deploy no Render (Gratuito)

## 📋 Por que Render?
- ✅ **Gratuito** para projetos pequenos
- ✅ **Fácil** de configurar
- ✅ **Deploy automático** via GitHub
- ✅ **HTTPS** automático
- ✅ **Logs** em tempo real

## 🔧 Passo a Passo

### **1. Preparar Código**
```bash
# Adicionar script de start para produção
# Já está configurado no package.json
```

### **2. Criar Conta no Render**
1. Acesse: https://render.com
2. Clique **"Get Started for Free"**
3. Faça login com GitHub

### **3. Conectar Repositório**
1. **New** → **Web Service**
2. **Connect a repository**
3. Selecione seu repositório
4. **Connect**

### **4. Configurar Deploy**
- **Name:** `sistema-autoescola-ideal-api`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### **5. Configurar Variáveis de Ambiente**
Na seção **Environment Variables**, adicionar:

```
FIREBASE_PROJECT_ID=sistema-autoescola-ideal
FIREBASE_PRIVATE_KEY_ID=37030276df398646de6fa2e6fa1d79fc5ded1786
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCnFUdCHVyQzfji\nIJ/hZ3FTFBtNi+G0EB3H1a8gE6xgFcos0h9fObfueHRLS3CNSJmn50n7ISN2I4VM\nCXId/xmPiWSaApp+1SwVKaqt3SCYUQxabQijYcW6nIz9B4X/aTnqGMHPJj6zlpkV\nxNNuUXylnw5NQnTu2ESCh3cqu1754Yesv5cBXGZYdk0gt5ZG9DTDyR6hL5dGI0w1\nQ1IfQVK3lseS0zWrt4xvUsvMirHjDw9CEBX9v7zwkJ7uI23enccKY/eduXYAUwFM\nD85CeEnIehSqYlw8dI+DZkBAkVyEkPTJ+O3KxFmplB+7v8eP9v9f9U5izYLlL+xk\n0kBswxDtAgMBAAECggEADVSWhpkam0f/qSTytJRg94ClbAKyy3+0rI6pJf1D1bev\nVXOfQqTzfpB4MNCwRmlqLvn2TlW2w1RyrF4dj3ScqLXMw7fc9S0TUw3ruurnUJe4\nzVchJw3kLW8TlZV91KKj1wBKKDmUK5ZimNjHCKhyMjGWPcZFV5AEKUjfElb4LSX2\n5ABnNXFjF5w0zTl3y8N1DzJK6bgnTwELUedysIGUymVcUJNoim3FPoeDSVp6Sh20\n5DcbwKQqWFXVVDD8L0OfqfyBTL0iXaV4R0AmHWCTMvbQ6FyB90HFHBf3v0LFqcQt\nC5MHci5Ag0EEEzCktrkNn+S32tspe2RF4fBkQJYAiQKBgQDg2BqwZw0FQkhDmE5N\nFYhsClP9eZleHom8E6bqdFBSDxS4ErvtNRgo6erTDSDPKwIn3zozwwaB4LNwJgOA\nlwmSV0a4YzN7eQcbE4k4rKSqz6VW5SCqv6EQI93ERpaJF+UQRaeIHfrgbpT3ovpF\nAzmgIIt4uaZPfL3+WyKeiolQFQKBgQC+PDeQCWIwwD2DT+wxIUz/Mn583lba9cQF\nH7mhKU5tqB8HSlip3XwXoWxWj8+9dKtWmkuGLBao0XSlGtPP8LiMzEV9ivfOQT4e\n5+E6brwnM5UWVKPtjHUVpovCmjmlN29shyds1ltNzXWZdCg0uNb2D0GzHaP7xkO4\n+q25zUIbeQKBgQCJ6UOFi8/at+snOtZcRablzffyc5F0v3pwGAW7rRhPHNzygtsu\nBfEJt2DHjzfemly6JBvJAAiPxUmKsmZXi0zdrBa+pmo/g96t5u+2CX7/Hlol0GiX\nEu8xvS4bY8iV0kg4EOFPhkQJQQqyUg78IZxI8W1a4VR3UOYgi7nSUNskeQKBgQC2\n3X+zr7F5l3IKBgvPdmljbxBzy+7F8DWLj2GLb/96HYAmK+tq7gNZW8yesQNK5RnG\n1+79fOgTQ7TS+STe4FEm1z19Xtayp7ilUNUKrGOlc0o++wHRWZE7TKtQV5xOGym6\ns3jMgImoEnaXGjeD5qKMSUIogbeeUInNCPtyfcKsUQKBgQDSpUzfAc75XFqjxb96\nmSCxpjOBd2GsW/1HKu2r3M4f1Vc8jksU/w1eLAdpCuxwqI72LuOUCj4BRrL1AulW\n9OqbvN0obmVKlk0OOsLJumDyPiXpr6B3WuX+QZffWhN/Bdek7IN2MP/EO0Min5DS\nkQwLaPF5DOmJiqAiE9bNeo31Ug==\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sistema-autoescola-ideal.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=102449714399643251823
JWT_SECRET=autoescola_ideal_super_secret_key_123456789
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=production
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15
```

### **6. Deploy**
1. Clique **"Create Web Service"**
2. Aguarde o build (5-10 minutos)
3. Sua API estará disponível em: `https://sistema-autoescola-ideal-api.onrender.com`

### **7. Testar Deploy**
```bash
# Testar API em produção
curl https://sistema-autoescola-ideal-api.onrender.com/api/health

# Testar login
curl -X POST https://sistema-autoescola-ideal-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@autoescolaideal.com",
    "password": "admin123",
    "unit": "administrador"
  }'
```

## 🎉 Pronto!
Sua API estará funcionando em produção, gratuita e com HTTPS automático! 