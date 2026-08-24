# WFin — Controle de Despesas Fixas e Parceladas

Aplicação web responsiva (mobile-first) para registrar despesas fixas e compras parceladas, com **comparação automática mês a mês** mostrando a diferença em **R$ e %**.

## Funcionalidades

- **Despesas fixas mensais** — registre contas recorrentes (aluguel, luz, internet...) por mês de referência
- **Compras parceladas** — informe o valor total, o nº de parcelas e o mês da 1ª parcela; o app calcula o valor de cada parcela, o progresso e quando termina
- **Comparação com o mês anterior**
  - Cards-resumo: total do mês, fixas e parcelas — cada um com variação em R$ e %
  - Item a item nas fixas: ▲ aumentou / ▼ diminuiu / = igual / ★ novo este mês
  - Lista de contas do mês anterior que ainda não foram registradas
- **Copiar mês anterior** — replica as fixas do mês anterior em um toque
- **Gráfico dos últimos 6 meses** — evolução do total gasto, navegação rápida pelo gráfico
- **Tema claro/escuro**, **PWA instalável** (atalho na tela inicial do celular)
- **Multiusuário** com autenticação por e-mail/senha (Supabase Auth + Row Level Security)

## Stack

| Camada    | Tecnologia                     |
| --------- | ------------------------------ |
| Frontend  | Next.js 15 (App Router), React 19, TypeScript |
| Estilo    | Tailwind CSS v4                |
| Dados     | Supabase (Postgres + Auth)     |
| Deploy    | Vercel (deploy automático via GitHub) |

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do Supabase
npm run dev
```

Acesse http://localhost:3000

## Configuração do Supabase (gratuito)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, cole e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) — cria a tabela `expenses` com Row Level Security (cada usuário só vê as próprias despesas)
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email" se quiser cadastro sem confirmação

## Deploy na Vercel com atualização automática

1. Suba este repositório para o GitHub
2. Acesse [vercel.com/new](https://vercel.com/new) e **importe o repositório**
3. Em *Environment Variables*, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

Pronto: a cada `git push` na branch `main`, a Vercel compila e publica automaticamente. Pull requests ganham preview URLs separadas.

## Estrutura

```
src/
├── app/              # Páginas (App Router): / e /login
├── components/       # Dashboard, modal, cards, seções, ícones
├── context/          # AppContext: sessão + CRUD de despesas
└── lib/              # Regras de cálculo, formatação, meses, cliente Supabase
supabase/schema.sql   # Schema + políticas RLS
```

## Roadmap de melhorias

- [ ] Categorias personalizadas e relatório por categoria
- [ ] Exportar/importar dados (CSV)
- [ ] Lembretes de contas não pagas no mês (notificação push)
- [ ] Receitas e saldo mensal
- [ ] Metas de gastos por categoria
- [ ] Widget de mobile para gasto rápido
- [ ] Compartilhamento de orçamento familiar (convites)
