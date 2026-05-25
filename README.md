# Guilda POE2 Alta Ajuda

Site de registro de membros com Firebase Firestore (dados em tempo real).

---

## Arquivos

| Arquivo    | Descrição                        |
|------------|----------------------------------|
| index.html | Estrutura da página              |
| style.css  | Visual temático Path of Exile 2  |
| app.js     | Lógica + integração Firebase     |
| README.md  | Este guia                        |

---

## Como configurar o Firebase (passo a passo)

### 1. Criar o projeto
1. Acesse **console.firebase.google.com**
2. Clique em **Adicionar projeto**
3. Dê um nome (ex: `guilda-poe2`) e conclua

### 2. Criar o banco de dados
1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de teste** (permite leitura/escrita por 30 dias)
4. Escolha a região mais próxima (ex: `southamerica-east1`) e confirme

### 3. Registrar o app Web
1. Na tela inicial do projeto, clique no ícone **</>** (Web)
2. Dê um apelido ao app (ex: `guilda-web`) e clique em **Registrar**
3. Copie o objeto `firebaseConfig` que aparecer — parece assim:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

### 4. Colar no app.js
Abra o arquivo **app.js** e substitua o bloco `FIREBASE_CONFIG` no topo pelos seus valores:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",       // <- seu valor
  authDomain:        "seu-projeto.firebaseapp.com",
  projectId:         "seu-projeto",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};
```

### 5. Fazer upload no GitHub
1. Vá ao seu repositório no GitHub
2. Clique em **Add file → Upload files**
3. Faça upload do **app.js** atualizado (pode substituir o anterior)
4. Clique em **Commit changes**

Aguarde 1-2 minutos e o site estará online com dados compartilhados em tempo real!

---

## Renovar o Firestore após 30 dias

O modo de teste expira em 30 dias. Para renovar:
1. No Firebase Console → **Firestore Database** → **Regras**
2. Substitua a data de expiração ou use esta regra permanente (somente leitura/escrita pública):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
