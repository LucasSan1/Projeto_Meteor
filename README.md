# Cosmo — Sistema de Gestão para Usinagem

Sistema web de gestão industrial para o cenário fictício de uma empresa de usinagem. Integra fornecedores e matérias-primas, controle de estoque, ordens de produção, qualidade, agenda de profissionais e manutenção de equipamentos, com acesso por perfil (gestor, operador e mecânico).

> O repositório também é referenciado como **Projeto Meteor**; os scripts originais em MySQL mantêm esse nome.

## Stack

- **Next.js 16 + React 19** — interface e API (App Router)
- **PostgreSQL (Supabase)** — persistência
- **JWT + bcrypt** — autenticação e senhas
- **Tailwind CSS** — estilos
- **Vitest** — testes

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `aplicacao/` | Aplicação Next.js: páginas, rotas de API, utilitários e testes |
| `DataBase_Meteor/` | Scripts SQL, inserts, queries e modelagem (DER) |

Os scripts atuais são de **PostgreSQL/Supabase** (`Cosmos DDL PostgreSQL.sql` e `Cosmos INSERTS PostgreSQL.sql`). Os arquivos `Meteor DDL.sql` e `Meteor INSERTS.sql` são a versão original em MySQL, mantida como referência.

## Como rodar

```bash
cd aplicacao
npm install
npm run dev
```

Crie o `aplicacao/.env` com as credenciais do banco PostgreSQL/Supabase, o `JWT_SECRET` e, para rodar a integração, as variáveis `TESTE_*`.

Depois aplique o DDL e os inserts de `DataBase_Meteor/`. A aplicação sobe em [http://localhost:3000](http://localhost:3000).

## Testes

Duas camadas:

- **Unitária** — exercita as regras puras, sem banco
- **Integração** — chama as rotas reais contra um PostgreSQL de teste

```bash
cd aplicacao
npm test          # unitária
npm run test:db   # integração (usa as variáveis TESTE_*)
npm run test:all  # as duas
```

A integração recria o schema e aplica o seed antes de cada arquivo de teste. Os cenários CT01–CT06 cobrem estoque/fornecedores, ordens de produção, qualidade, agenda, manutenções e segurança/auditoria. Detalhes em [`aplicacao/tests/README.md`](aplicacao/tests/README.md).

