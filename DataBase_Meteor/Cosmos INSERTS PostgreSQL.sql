-- ============================================================
--  Cosmos - Seed de dados de exemplo (PostgreSQL / Supabase)
--  Porte do "Meteor INSERTS.sql" pro Postgres, com elenco novo.
-- ============================================================

DO $$
DECLARE
  u_gerente INT;
  u_irinel  INT;
  u_fulano  INT;
  u_serjao  INT;
  u_galo    INT;
  p_irinel  INT;
  p_fulano  INT;
  p_serjao  INT;
  p_galo    INT;
BEGIN


  --  PESSOAS

  -- O gerente só gerencia, não vira profissional alocável
  INSERT INTO usuarios (nome, email, cargo, senha, status)
  VALUES ('Naldo Benni', 'naldo.benni@meteor.com', 'gerente', '$2b$10$1wxhLFbGyJhzrMEyONQIJ.hxMcx3stqLl6yCt8xvjt8rZWDwbT0We', 'Ativo')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO u_gerente FROM usuarios WHERE email = 'naldo.benni@meteor.com';

  INSERT INTO usuarios (nome, email, cargo, senha, status)
  VALUES ('Irinel', 'irinel@meteor.com', 'operador', '$2b$10$1wxhLFbGyJhzrMEyONQIJ.hxMcx3stqLl6yCt8xvjt8rZWDwbT0We', 'Ativo')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO u_irinel FROM usuarios WHERE email = 'irinel@meteor.com';

  INSERT INTO usuarios (nome, email, cargo, senha, status)
  VALUES ('Fulano deTal', 'fulano.detal@meteor.com', 'operador', '$2b$10$1wxhLFbGyJhzrMEyONQIJ.hxMcx3stqLl6yCt8xvjt8rZWDwbT0We', 'Ativo')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO u_fulano FROM usuarios WHERE email = 'fulano.detal@meteor.com';

  INSERT INTO usuarios (nome, email, cargo, senha, status)
  VALUES ('Serjão Berranteiro', 'serjao.berranteiro@meteor.com', 'mecanico', '$2b$10$1wxhLFbGyJhzrMEyONQIJ.hxMcx3stqLl6yCt8xvjt8rZWDwbT0We', 'Ativo')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO u_serjao FROM usuarios WHERE email = 'serjao.berranteiro@meteor.com';

  INSERT INTO usuarios (nome, email, cargo, senha, status)
  VALUES ('Galo Cego', 'galo.cego@meteor.com', 'mecanico', '$2b$10$1wxhLFbGyJhzrMEyONQIJ.hxMcx3stqLl6yCt8xvjt8rZWDwbT0We', 'Ativo')
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO u_galo FROM usuarios WHERE email = 'galo.cego@meteor.com';

  -- Uma linha por pessoa, com as flags dos papéis
  -- Ninguém aqui é operador E mecânico ao mesmo tempo, pra manter o exemplo simples
  INSERT INTO profissionais (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone, status)
  VALUES (u_irinel, 1, 0, 'Usinagem', '(11) 98888-1001', 'Ativo')
  ON CONFLICT (fk_usuarioID) DO NOTHING;
  SELECT pk_profissionalID INTO p_irinel FROM profissionais WHERE fk_usuarioID = u_irinel;

  INSERT INTO profissionais (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone, status)
  VALUES (u_fulano, 1, 0, 'Montagem', '(11) 98888-1002', 'Ativo')
  ON CONFLICT (fk_usuarioID) DO NOTHING;
  SELECT pk_profissionalID INTO p_fulano FROM profissionais WHERE fk_usuarioID = u_fulano;

  INSERT INTO profissionais (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone, status)
  VALUES (u_serjao, 0, 1, 'Mecânica', '(11) 98888-1003', 'Ativo')
  ON CONFLICT (fk_usuarioID) DO NOTHING;
  SELECT pk_profissionalID INTO p_serjao FROM profissionais WHERE fk_usuarioID = u_serjao;

  INSERT INTO profissionais (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone, status)
  VALUES (u_galo, 0, 1, 'Elétrica', '(11) 98888-1004', 'Ativo')
  ON CONFLICT (fk_usuarioID) DO NOTHING;
  SELECT pk_profissionalID INTO p_galo FROM profissionais WHERE fk_usuarioID = u_galo;



  --  SUPRIMENTOS E ESTOQUE
  INSERT INTO fornecedores (pk_fornecedorID, nomeFornecedor, cnpj, endereco, contato, avaliacao, status) VALUES
  (1, 'Aço Brasil Ltda', '11222333000181', 'Av. das Indústrias, 1200 - São Paulo/SP', '(11) 4002-8922', 9.1, 'Ativo'),
  (2, 'Metalúrgica Ferro Forte', '22333444000192', 'Rua do Aço, 450 - Betim/MG', '(31) 3322-1100', 8.5, 'Ativo'),
  (3, 'Polímeros Andinos', '33444555000103', 'Rod. BR-101, km 42 - Joinville/SC', '(47) 3456-7788', 7.8, 'Ativo'),
  (4, 'Componentes Delta', '44555666000114', 'Av. dos Autonomistas, 980 - Campinas/SP', '(19) 3888-4455', 9.4, 'Ativo'),
  (5, 'Insumos Central', '55666777000125', 'Rua das Oficinas, 77 - Curitiba/PR', '(41) 3777-2211', 6.9, 'Desativado')
  ON CONFLICT DO NOTHING;

  -- Dois materiais de propósito abaixo do mínimo, pra acender o alerta do dashboard
  INSERT INTO materiasPrimas (pk_materiaID, materia, fk_fornecedor, unidadeMedida, estoqueMinimo, quantidadeEstoque, dataUltimaCompra, status) VALUES
  (1, 'Barra de Aço 1020', 1, 'kg', 100.000, 850.000, '2026-10-20', 'Ativo'),
  (2, 'Chapa de Aço 1045', 2, 'kg', 80.000, 76.000, '2026-10-15', 'Ativo'),
  (3, 'Resina Polimérica', 3, 'kg', 50.000, 320.000, '2026-10-18', 'Ativo'),
  (4, 'Parafuso M8', 4, 'un', 200.000, 1500.000, '2026-10-22', 'Ativo'),
  (5, 'Óleo Lubrificante', 5, 'L', 20.000, 18.000, '2026-10-10', 'Ativo')
  ON CONFLICT DO NOTHING;


  --  PRODUÇÃO
  INSERT INTO pecas (pk_pecaID, peca, peso, dimensoes, status) VALUES
  (1, 'Eixo Cilíndrico 120mm', '2.4 kg', '120x40x40 mm', 'Ativo'),
  (2, 'Engrenagem Helicoidal Z24', '1.8 kg', '90x90x30 mm', 'Ativo'),
  (3, 'Carcaça de Alumínio', '3.2 kg', '200x150x80 mm', 'Ativo'),
  (4, 'Flange de Fixação', '0.9 kg', '80x80x15 mm', 'Ativo'),
  (5, 'Suporte Angular', '1.5 kg', '150x60x60 mm', 'Desativado')
  ON CONFLICT DO NOTHING;

  -- 5 concluídas (pra alimentar inspeções e histórico), mais 1 em produção,
  -- 1 pendente e 1 cancelada: todos os status do ENUM ficam representados
  INSERT INTO ordensProducao
    (pk_ordemID, codigo, fk_pecaID, quantidadePlanejada, especializacao, fk_operadorID, inicioPlanejado, terminoPlanejado, inicioEfetivo, conclusaoEfetiva, status)
  VALUES
  (1, 'OP-2026-001', 1, 100, 'Usinagem', p_irinel, '2026-09-01 08:00:00', '2026-09-05 17:00:00', '2026-09-01 08:10:00', '2026-09-04 16:40:00', 'Concluída'),
  (2, 'OP-2026-002', 2, 50, 'Usinagem', p_irinel, '2026-09-08 08:00:00', '2026-09-12 17:00:00', '2026-09-08 08:00:00', '2026-09-11 17:20:00', 'Concluída'),
  (3, 'OP-2026-003', 3, 200, 'Montagem', p_fulano, '2026-10-12 08:00:00', '2026-10-18 17:00:00', '2026-10-12 08:05:00', NULL, 'Em Produção'),
  (4, 'OP-2026-004', 4, 75, 'Montagem', p_fulano, '2026-10-20 08:00:00', '2026-10-25 17:00:00', NULL, NULL, 'Pendente'),
  (5, 'OP-2026-005', 5, 30, 'Usinagem', p_irinel, '2026-09-15 08:00:00', '2026-09-19 17:00:00', '2026-09-15 08:00:00', '2026-09-18 17:10:00', 'Concluída'),
  (6, 'OP-2026-006', 3, 120, 'Montagem', p_fulano, '2026-09-22 08:00:00', '2026-09-28 17:00:00', '2026-09-22 08:15:00', '2026-09-27 15:50:00', 'Concluída'),
  (7, 'OP-2026-007', 1, 80, 'Usinagem', p_irinel, '2026-09-29 08:00:00', '2026-10-03 17:00:00', '2026-09-29 08:00:00', '2026-10-02 16:30:00', 'Concluída'),
  (8, 'OP-2026-008', 2, 40, 'Usinagem', p_irinel, '2026-10-05 08:00:00', '2026-10-09 17:00:00', NULL, NULL, 'Cancelada')
  ON CONFLICT DO NOTHING;

  -- Materiais previstos/consumidos pelas ordens
  INSERT INTO ordemMateriais (pk_ordemMaterialID, fk_ordemID, fk_materiaID, quantidadePrevista, quantidadeConsumida) VALUES
  (1, 1, 1, 40.000, 38.000),
  (2, 1, 2, 5.000, 5.000),
  (3, 2, 1, 20.000, 19.000),
  (4, 5, 1, 15.000, 14.000),
  (5, 6, 2, 12.000, 12.000)
  ON CONFLICT DO NOTHING;

  -- Trilha de mudança de status das ordens (inclui a cancelada)
  INSERT INTO historicoOrdens (pk_historicoID, fk_ordemID, fk_usuarioID, statusAnterior, statusNovo, dataAlteracao, observacao) VALUES
  (1, 1, u_gerente, 'Pendente', 'Em Produção', '2026-09-01 08:10:00', 'Início da produção'),
  (2, 1, u_gerente, 'Em Produção', 'Concluída', '2026-09-04 16:40:00', 'Ordem concluída'),
  (3, 2, u_gerente, 'Pendente', 'Em Produção', '2026-09-08 08:00:00', 'Início da produção'),
  (4, 3, u_gerente, 'Pendente', 'Em Produção', '2026-10-12 08:05:00', 'Início da produção'),
  (5, 8, u_gerente, 'Pendente', 'Cancelada', '2026-10-04 09:30:00', 'Cancelada por falta de material')
  ON CONFLICT DO NOTHING;



  --  QUALIDADE

  -- Uma inspeção por ordem concluída.
  INSERT INTO inspecoes (pk_inspecaoID, fk_ordemID, totalProduzido, aprovadas, rejeitadas, dataInspecao, observacoes) VALUES
  (1, 1, 100, 96, 4, '2026-09-04 17:00:00', 'Lote aprovado com ressalvas'),
  (2, 2, 50, 48, 2, '2026-09-11 17:40:00', 'Duas peças fora de tolerância'),
  (3, 5, 30, 27, 3, '2026-09-18 17:30:00', 'Trinca interna em três peças'),
  (4, 6, 120, 115, 5, '2026-09-27 16:20:00', 'Porosidade superficial'),
  (5, 7, 80, 78, 2, '2026-10-02 17:00:00', 'Falha de montagem em duas peças')
  ON CONFLICT DO NOTHING;

  -- O detalhe das rejeições precisa caber no total rejeitado de cada inspeção
  -- Retrabalhos aparecem como Concluído; perdas ficam Pendente de ação
  INSERT INTO rejeicoes (pk_rejeicaoID, fk_inspecaoID, quantidade, motivoRejeicao, tipo, acoesCorretivas, status, dataRejeicao) VALUES
  (1, 1, 4, 'Rebarba excessiva', 'Perda', 'Ajuste da ferramenta de corte', 'Pendente', '2026-09-04 17:00:00'),
  (2, 2, 2, 'Dimensão fora da tolerância', 'Retrabalho', 'Retrabalho no torno', 'Concluído', '2026-09-11 17:40:00'),
  (3, 3, 3, 'Trinca interna', 'Perda', 'Revisão do processo de fundição', 'Pendente', '2026-09-18 17:30:00'),
  (4, 4, 5, 'Porosidade superficial', 'Perda', NULL, 'Pendente', '2026-09-27 16:20:00'),
  (5, 5, 2, 'Falha de montagem', 'Retrabalho', 'Remontagem e nova conferência', 'Concluído', '2026-10-02 17:00:00')
  ON CONFLICT DO NOTHING;



  --  MANUTENÇÃO

  INSERT INTO equipamentos (pk_equipamentoID, nomeEquipamento, descricao, dataAquisicao, vidaUtilRestante, status) VALUES
  (1, 'Torno CNC', 'Torno de precisão para eixos e pinos', '2022-03-15', 2500, 'Ativo'),
  (2, 'Fresadora Universal', 'Fresamento de engrenagens e cavidades', '2021-07-10', 1800, 'Ativo'),
  (3, 'Prensa Hidráulica', 'Conformação de chapas e flanges', '2020-11-05', 900, 'Ativo'),
  (4, 'Compressor de Ar', 'Alimentação pneumática da linha', '2023-01-20', 4000, 'Ativo'),
  (5, 'Forno de Tratamento Térmico', 'Têmpera e revenimento de peças', '2019-05-12', 300, 'Desativado')
  ON CONFLICT DO NOTHING;

  INSERT INTO maquinas (pk_maquinaID, fk_equipamentoID, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao, status) VALUES
  (1, 1, 'Torno CNC Romi GL-240', 'Torno de bancada com comando Siemens', '300 mm', '2026-09-15', 'Ativo'),
  (2, 2, 'Fresadora FresaTop 500', 'Fresadora horizontal de três eixos', '500x300 mm', '2026-08-20', 'Ativo'),
  (3, 3, 'Prensa PH-120', 'Prensa hidráulica de dupla ação', '120 ton', '2026-07-05', 'Ativo'),
  (4, 4, 'Compressor Atlas 10HP', 'Compressor de parafuso com secador', '10 bar', '2026-09-28', 'Ativo'),
  (5, 5, 'Forno FT-800', 'Forno elétrico com controlador digital', '800 °C', '2026-06-12', 'Desativado')
  ON CONFLICT DO NOTHING;

  -- Histórico de produção depende das máquinas, então só entra depois delas
  INSERT INTO historicoProducao
    (pk_historicoProducaoID, fk_ordemID, fk_operadorID, fk_maquinaID, dataConclusao, quantidadeProduzida)
  VALUES
  (1, 1, p_irinel, 1, '2026-09-04 16:40:00', 100),
  (2, 2, p_irinel, 2, '2026-09-11 17:20:00', 50),
  (3, 5, p_irinel, 1, '2026-09-18 17:10:00', 30),
  (4, 6, p_fulano, 3, '2026-09-27 15:50:00', 120),
  (5, 7, p_irinel, 2, '2026-10-02 16:30:00', 80)
  ON CONFLICT DO NOTHING;

  -- 5 concluídas (pra fechar o histórico), mais 1 em execução, 1 programada e 1 cancelada
  INSERT INTO manutencoesProgramadas
    (pk_manutencaoID, fk_equipamentoID, fk_maquinaID, tipoManutencao, descricao, especializacao, fk_mecanicoID, inicioPrevisto, terminoPrevisto, inicioEfetivo, conclusaoEfetiva, servicosRealizados, status)
  VALUES
  (1, 1, 1, 'Preventiva', 'Troca de correia e lubrificação geral', 'Mecânica', p_serjao, '2026-09-15 08:00:00', '2026-09-15 12:00:00', '2026-09-15 08:00:00', '2026-09-15 11:30:00', 'Correia trocada e fusos lubrificados', 'Concluída'),
  (2, 2, 2, 'Corretiva', 'Substituição do rolamento do eixo principal', 'Mecânica', p_serjao, '2026-08-20 08:00:00', '2026-08-20 17:00:00', '2026-08-20 08:10:00', '2026-08-20 16:40:00', 'Rolamento substituído e eixo balanceado', 'Concluída'),
  (3, 3, 3, 'Preventiva', 'Revisão do sistema hidráulico', 'Hidráulica', p_serjao, '2026-07-05 08:00:00', '2026-07-05 16:00:00', '2026-07-05 08:00:00', '2026-07-05 15:30:00', 'Óleo hidráulico e vedações trocados', 'Concluída'),
  (4, 4, 4, 'Preventiva', 'Limpeza e troca de filtros', 'Mecânica', p_serjao, '2026-09-28 09:00:00', '2026-09-28 12:00:00', '2026-09-28 09:00:00', '2026-09-28 11:45:00', 'Filtros de ar e óleo substituídos', 'Concluída'),
  (5, 5, 5, 'Corretiva', 'Reparo da resistência de aquecimento', 'Elétrica', p_galo, '2026-06-12 08:00:00', '2026-06-12 17:00:00', '2026-06-12 08:15:00', '2026-06-12 16:20:00', 'Resistência substituída e forno testado', 'Concluída'),
  (6, 2, 2, 'Corretiva', 'Ajuste do sistema de refrigeração', 'Mecânica', p_serjao, '2026-11-04 08:00:00', '2026-11-04 17:00:00', '2026-11-04 08:30:00', NULL, NULL, 'Em Execução'),
  (7, 1, 1, 'Preventiva', 'Lubrificação geral e inspeção de fusos', 'Mecânica', p_serjao, '2026-11-10 08:00:00', '2026-11-10 12:00:00', NULL, NULL, NULL, 'Programada'),
  (8, 4, NULL, 'Preditiva', 'Análise de vibração do compressor', 'Elétrica', p_galo, '2026-10-25 09:00:00', '2026-10-25 11:00:00', NULL, NULL, NULL, 'Cancelada')
  ON CONFLICT DO NOTHING;

  INSERT INTO historicoManutencao
    (historicoID, fk_manutencaoID, fk_equipamentoID, fk_mecanicoID, manutencaoRealizada, dataManutencao, inicioEfetivo, terminoEfetivo, custos, observacoes)
  VALUES
  (1, 1, 1, p_serjao, 'Preventiva', '2026-09-15', '2026-09-15 08:00:00', '2026-09-15 11:30:00', 1250.00, 'Troca de correia e lubrificação'),
  (2, 2, 2, p_serjao, 'Corretiva', '2026-08-20', '2026-08-20 08:10:00', '2026-08-20 16:40:00', 2380.50, 'Substituição do rolamento do eixo'),
  (3, 3, 3, p_serjao, 'Preventiva', '2026-07-05', '2026-07-05 08:00:00', '2026-07-05 15:30:00', 890.00, 'Revisão do sistema hidráulico'),
  (4, 4, 4, p_serjao, 'Preventiva', '2026-09-28', '2026-09-28 09:00:00', '2026-09-28 11:45:00', 450.75, 'Limpeza e troca de filtros'),
  (5, 5, 5, p_galo, 'Corretiva', '2026-06-12', '2026-06-12 08:15:00', '2026-06-12 16:20:00', 3120.00, 'Reparo da resistência de aquecimento')
  ON CONFLICT DO NOTHING;



  --  MOVIMENTAÇÕES DE ESTOQUE


  -- Entradas não têm ordem, saídas sempre nascem de uma ordem
  INSERT INTO movimentacoesEstoque
    (pk_movimentacaoID, fk_materiaID, tipo, quantidade, unidadeMedida, fk_usuarioID, fk_ordemID, dataMovimentacao, observacao)
  VALUES
  (1, 1, 'Entrada', 200.000, 'kg', u_gerente, NULL, '2026-10-20 09:00:00', 'Compra de reposição'),
  (2, 3, 'Entrada', 100.000, 'kg', u_gerente, NULL, '2026-10-18 10:30:00', 'Compra de reposição'),
  (3, 4, 'Entrada', 500.000, 'un', u_gerente, NULL, '2026-10-22 14:00:00', 'Compra de reposição'),
  (4, 1, 'Saida', 38.000, 'kg', u_irinel, 1, '2026-09-04 16:30:00', 'Consumo da OP-2026-001'),
  (5, 2, 'Saida', 5.000, 'kg', u_irinel, 1, '2026-09-04 16:35:00', 'Consumo da OP-2026-001')
  ON CONFLICT DO NOTHING;



  --  AUDITORIA

  -- JSON_OBJECT do MySQL deu lugar ao jsonb_build_object do Postgres
  INSERT INTO auditoria
    (pk_auditoriaID, fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao, dataAcao)
  VALUES
  (1, u_gerente, 'ordem', 1, 'mudancaStatus', jsonb_build_object('status', 'Pendente'), jsonb_build_object('status', 'Em Produção'), 'Início da produção', '2026-09-01 08:10:00'),
  (2, u_gerente, 'ordem', 1, 'mudancaStatus', jsonb_build_object('status', 'Em Produção'), jsonb_build_object('status', 'Concluída'), 'Ordem concluída', '2026-09-04 16:40:00'),
  (3, u_gerente, 'ordem', 2, 'mudancaStatus', jsonb_build_object('status', 'Pendente'), jsonb_build_object('status', 'Em Produção'), 'Início da produção', '2026-09-08 08:00:00'),
  (4, u_gerente, 'ordem', 8, 'cancelamento', jsonb_build_object('status', 'Pendente'), jsonb_build_object('status', 'Cancelada'), 'Cancelada por falta de material', '2026-10-04 09:30:00'),
  (5, u_serjao, 'manutencao', 1, 'mudancaStatus', jsonb_build_object('status', 'Programada'), jsonb_build_object('status', 'Concluída'), 'Manutenção concluída', '2026-09-15 11:30:00')
  ON CONFLICT DO NOTHING;

END $$;


--  AJUSTE DAS SEQUENCES

-- O seed crava IDs na mão, então as sequences ficam pra trás e o próximo
-- INSERT do app trombaria com "duplicate key". Isso acerta todas de uma vez

DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND is_identity = 'YES'
  LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE(MAX(%I), 1), MAX(%I) IS NOT NULL) FROM %I',
      'public.' || col.table_name,
      col.column_name,
      col.column_name,
      col.column_name,
      col.table_name
    );
  END LOOP;
END $$;

-- Resumo rápido pra conferir se tudo entrou
SELECT 'usuarios' AS tabela, COUNT(*) AS total FROM usuarios
UNION ALL SELECT 'profissionais', COUNT(*) FROM profissionais
UNION ALL SELECT 'fornecedores', COUNT(*) FROM fornecedores
UNION ALL SELECT 'materiasPrimas', COUNT(*) FROM materiasPrimas
UNION ALL SELECT 'pecas', COUNT(*) FROM pecas
UNION ALL SELECT 'ordensProducao', COUNT(*) FROM ordensProducao
UNION ALL SELECT 'ordemMateriais', COUNT(*) FROM ordemMateriais
UNION ALL SELECT 'historicoOrdens', COUNT(*) FROM historicoOrdens
UNION ALL SELECT 'historicoProducao', COUNT(*) FROM historicoProducao
UNION ALL SELECT 'inspecoes', COUNT(*) FROM inspecoes
UNION ALL SELECT 'rejeicoes', COUNT(*) FROM rejeicoes
UNION ALL SELECT 'equipamentos', COUNT(*) FROM equipamentos
UNION ALL SELECT 'maquinas', COUNT(*) FROM maquinas
UNION ALL SELECT 'manutencoesProgramadas', COUNT(*) FROM manutencoesProgramadas
UNION ALL SELECT 'historicoManutencao', COUNT(*) FROM historicoManutencao
UNION ALL SELECT 'movimentacoesEstoque', COUNT(*) FROM movimentacoesEstoque
UNION ALL SELECT 'auditoria', COUNT(*) FROM auditoria;
