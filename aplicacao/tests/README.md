# Testes automatizados do Cosmo

A suíte tem duas camadas:

- **Unitária**: exercita as regras puras do backend, sem banco e sem servidor
- **Integração**: chama os route handlers do Next direto, autenticando com JWT real e rodando
  contra o PostgreSQL de teste. O que é impossível automatizar localmente (navegadores, backup)
  continua com `it.skip`

## Como rodar

```bash
cd aplicacao

npm test          # unitária, uma vez
npm run test:watch
npm run test:db   # integração, usa o banco de teste do .env
npm run test:all  # unitária + integração
```

A unitária não precisa de banco. A integração precisa das variáveis `TESTE_*` no `.env`.

## Banco de teste

A integração lê `TESTE_DATABASE`, `TESTE_HOST`, `TESTE_PORT`, `TESTE_USER` e
`TESTE_PASSWORD`. O setup aceita ainda `TESTE_POOLER_HOST` e `TESTE_POOLER_PORT`, porque a
conexão direta do Supabase só resolve IPv6 em algumas redes e o pooler resolve IPv4

Antes de cada arquivo de teste, o setup:

1. aplica `DataBase_Meteor/Cosmos DDL PostgreSQL.sql`
2. aplica `DataBase_Meteor/Cosmos INSERTS PostgreSQL.sql`;
3. marca `primeiroAcesso = false` nos usuários do seed, senão as rotas devolveriam 403


## Mapa dos cenários

### Unitária

| Arquivo | Cenário | Requisitos da doc |
| --- | --- | --- |
| `ct01EstoqueFornecedores.test.js` | CT01 - fornecedores, matérias-primas e estoque |
| `ct02OrdensProducao.test.js` | CT02 - ordens de produção |
| `ct03Qualidade.test.js` | CT03 - qualidade da produção |
| `ct04Agenda.test.js` | CT04 - agenda e disponibilidade | 
| `ct05Manutencoes.test.js` | CT05 - manutenções 
| `ct06SegurancaAuditoria.test.js` | CT06 - segurança, auditoria e paginação |

### Integração

| Arquivo | Cenário | O que valida no banco real |
| --- | --- | --- |
| `integracao/ct01EstoqueFornecedores.integration.test.js` | CT01 | unicidade de CNPJ, vínculos, saldo, livro-razão, soft delete, dashboard |
| `integracao/ct02OrdensProducao.integration.test.js` | CT02 | criação transacional, saldo, ciclo de status, baixa única, concorrência e rollback |
| `integracao/ct03Qualidade.integration.test.js` | CT03 | inspeções, rejeições, indicadores e constraints de soma/unicidade |
| `integracao/ct04Agenda.integration.test.js` | CT04 | agenda por dia, sobreposição de horários, reprogramação, cancelamento e atraso |
| `integracao/ct05Manutencoes.integration.test.js` | CT05 | agendamento, titularidade, custos, histórico único e rollback |
| `integracao/ct06SegurancaAuditoria.integration.test.js` | CT06 | token inválido/expirado, conta inativa, troca de senha, auditoria e paginação |

## O que continua em `skip`

- Navegadores (Chrome, Firefox, Edge, mobile) e acessibilidade: exigem execução manual
- Backup e restauração: exigem ambiente de backup
- Separação de camadas: exige revisão do repositório, não um teste de execução
- Jornada/afastamento de profissional

## Estrutura

```
tests/
  apoio/datas.js                    # helpers de data no fuso de Brasília
  ct01EstoqueFornecedores.test.js
  ct02OrdensProducao.test.js
  ct03Qualidade.test.js
  ct04Agenda.test.js
  ct05Manutencoes.test.js
  ct06SegurancaAuditoria.test.js
  integracao/
    apoio/ambiente.js               # carrega TESTE_* e aponta o app pro banco de teste
    apoio/banco.js                  # pool, DDL, seed e consultas auxiliares
    apoio/setup.js                  # prepara o banco antes de cada arquivo
    apoio/api.js                    # chama route handler com Request + Bearer
    apoio/dados.js                  # usuários, ordens e datas de apoio
    ct01EstoqueFornecedores.integration.test.js
    ct02OrdensProducao.integration.test.js
    ct03Qualidade.integration.test.js
    ct04Agenda.integration.test.js
    ct05Manutencoes.integration.test.js
    ct06SegurancaAuditoria.integration.test.js
    smoke.integration.test.js       # fumaça: seed aplicado e rota respondendo
```
