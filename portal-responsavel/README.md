# Portal do Responsável — Beta (MVP)

Demonstração funcional de alta fidelidade, mobile-first. Login e chat são
100% funcionais via Firebase (Auth + Firestore); o Painel (notas/agenda)
ainda usa dados mockados.

## Configurar o Firebase

1. Crie um projeto em https://console.firebase.google.com.
2. Ative **Authentication → Sign-in method → E-mail/senha**.
3. Ative o **Firestore Database** (modo produção).
4. Em **Configurações do projeto → Seus apps**, crie um app Web e copie as chaves.
5. Copie `.env.local.example` para `.env.local` e preencha com essas chaves.
6. Publique as regras de `firestore.rules` (Console do Firebase → Firestore → Regras, ou via Firebase CLI: `firebase deploy --only firestore:rules`).
7. Crie ao menos um usuário de teste em **Authentication → Users → Add user** (e-mail/senha) para conseguir logar.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — use as ferramentas de dev do navegador em modo celular (ex.: iPhone 14) para a melhor visualização. Você será redirecionado para `/login` até autenticar.

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com → **Add New Project** → importe o repositório.
3. Framework Preset: **Next.js** (detectado automaticamente).
4. Em **Environment Variables**, adicione as mesmas 6 chaves do `.env.local`.
5. Deploy.

## Estrutura

```
app/                     # App Router (layout, página raiz, /login)
app/providers.tsx         # Client wrapper para o AuthProvider
components/               # Header, notas, calendário, bottom nav, RequireAuth
components/atendimento/   # Fluxo de chat: setor -> segmento -> chat (Firestore)
contexts/AuthContext.tsx  # Sessão do Firebase Auth (login/logout)
lib/firebase.ts           # Inicialização do Firebase (client-side)
lib/chat.ts                # Leitura/escrita das coleções chats e chats/{id}/messages
data/mock-data.ts         # Dados mockados (aluno, notas, agenda, textos de sistema)
firestore.rules            # Regras de segurança do Firestore
types/index.ts             # Tipos compartilhados
```

## Modelo de dados no Firestore

```
users/{uid}                          → perfil do responsável (não usado ainda pelo Painel)
chats/{chatId}                       → { responsavelId, setor, segmento, escalonado, criadoEm }
chats/{chatId}/messages/{messageId}  → { remetente, texto, autorId, timestamp }
```

Um novo `chats/{chatId}` é criado toda vez que o responsável entra na tela de
chat (ou clica em "Novo atendimento"). Para simular a escola respondendo,
adicione um documento manualmente na subcoleção `messages` pelo Console do
Firebase — a tela do pai atualiza em tempo real via `onSnapshot`.

## O que ainda é mockado

- Aluno, notas e faltas: `data/mock-data.ts` → `alunoMock`, `materiasMock`
- Agenda: `data/mock-data.ts` → `eventosMock`
- Textos de sistema (boas-vindas e escalonamento): `data/mock-data.ts`

Para trocar qualquer um desses dados, edite apenas esse arquivo.
