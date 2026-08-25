# WFin — Controle de Despesas, Receitas e Saldo

Aplicação web responsiva (mobile-first, adaptada para desktop com navegação no topo e layout em múltiplas colunas) para registrar despesas fixas, compras parceladas e **receitas**, com **comparação automática mês a mês** mostrando a diferença em **R$ e %**, saldo mensal e um dashboard completo de análises.

## Funcionalidades

- **Despesas fixas mensais** — contas recorrentes (aluguel, luz, internet...) por mês de referência
- **Compras parceladas** — informe o valor total **ou o valor de cada parcela** + nº de parcelas e mês da 1ª; o app calcula o restante, progresso e término
- **Despesas únicas** — gastos pontuais do mês (presente, reparo...) sem repetição nem comparação item a item
- **Receitas e saldo** — lançamentos mensais de receita; saldo do mês = receitas − despesas, comparado ao mês anterior
- **Categorias personalizadas por tipo** — conjuntos separados para despesas e receitas; crie, renomeie e exclua com emoji; as padrões vêm prontas
- **Comparação com o mês anterior**
  - Cards-resumo: saldo, receitas, despesas totais, fixas, parcelas e únicas — variação em R$ e %
  - Item a item: ▲ aumentou / ▼ diminuiu / = igual / ★ novo no mês
  - Lista de lançamentos do mês anterior ainda não registrados
- **Copiar mês anterior** — replica fixas ou receitas com um toque
- **Tela de Dashboard**
  - Resumo do ano: receitas, despesas e saldo (YTD)
  - Gráfico Receitas × Despesas dos últimos 6 meses
  - Distribuição de gastos por categoria (rosca) com variação vs. mês anterior
  - Top 5 maiores despesas do mês · média mensal dos últimos 6 meses
- **Navegação por tabs inferiores** estilo app, mês compartilhado pela URL (`?mes=YYYY-MM`)
- **Tema claro/escuro**, **PWA instalável**, autenticação multiusuário (Supabase Auth + RLS)

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
2. No **SQL Editor**, cole e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) — cria as tabelas `expenses` (com receitas) e `categories` (por tipo), com Row Level Security (cada usuário só vê os próprios dados)
3. **Projetos criados antes da v2**: execute também [`supabase/migration-002.sql`](supabase/migration-002.sql) (receitas + categorias), [`supabase/migration-003.sql`](supabase/migration-003.sql) (categorias por tipo) e [`supabase/migration-004.sql`](supabase/migration-004.sql) (despesas únicas)
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email" se quiser cadastro sem confirmação

> As categorias padrão (despesas e receitas) são semeadas automaticamente no primeiro login de cada usuário; quem já usava o app recebe as de receita no próximo acesso.

## Deploy na Vercel com atualização automática

1. Suba este repositório para o GitHub
2. Acesse [vercel.com/new](https://vercel.com/new) e **importe o repositório**
3. Em *Environment Variables*, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

Pronto: a cada `git push` na branch `main`, a Vercel compila e publica automaticamente. Pull requests ganham preview URLs separadas.

## Estrutura

```
src/
├── app/              # Páginas (App Router): /, /dashboard e /login
├── components/       # MonthView, DashboardScreen, seções, modais, tabs
├── context/          # AppContext: sessão + CRUD + diálogos globais
├── hooks/            # useRequireAuth
└── lib/              # Cálculos, formatação, meses, categorias, Supabase
supabase/
├── schema.sql        # Schema completo + políticas RLS
└── migration-002.sql # Migração p/ bases criadas antes da v2
```

## Roadmap de melhorias

- [x] Categorias personalizadas com emoji
- [x] Receitas e saldo mensal
- [x] Tela de dashboard (resumo anual, receitas×despesas, categorias, top despesas)
- [ ] Exportar/importar dados (CSV)
- [ ] Lembretes de contas não pagas no mês (notificação push)
- [ ] Metas de gastos por categoria
- [ ] Widget de mobile para gasto rápido
- [ ] Compartilhamento de orçamento familiar (convites)
