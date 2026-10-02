CREATE DATABASE IF NOT EXISTS meteor
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE meteor;

-- Desliga a checagem de FK pra dropar em qualquer ordem sem o MySQL reclamar.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS historicoManutencao;
DROP TABLE IF EXISTS manutencoesProgramadas;
DROP TABLE IF EXISTS maquinas;
DROP TABLE IF EXISTS equipamentos;
DROP TABLE IF EXISTS movimentacoesEstoque;
DROP TABLE IF EXISTS historicoOrdens;
DROP TABLE IF EXISTS rejeicoes;
DROP TABLE IF EXISTS aceitacoes;      -- Remover
DROP TABLE IF EXISTS inspecoes;
DROP TABLE IF EXISTS ordemMateriais;
DROP TABLE IF EXISTS ordensProducao;
DROP TABLE IF EXISTS pecas;
DROP TABLE IF EXISTS materiasPrimas;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS operadores;     -- Remover
DROP TABLE IF EXISTS mecanico;       -- Remover
DROP TABLE IF EXISTS profissionais;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
--  PESSOAS
-- ============================================================

-- Identidade de quem entra no sistema (gestor, operador ou mecânico).
CREATE TABLE usuarios (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL,
    email   VARCHAR(200) UNIQUE NOT NULL,
    cargo   ENUM('gerente', 'operador', 'mecanico') NOT NULL DEFAULT 'operador',
    senha   VARCHAR(200) NOT NULL, 
    status  ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo'
);

-- Profissionais alocáveis: UMA linha por pessoa, com flags dos papéis.
-- Quem é operador E mecânico tem identidade única, então o limite de
-- "1 atividade por dia" vale pra todas as atribuições (nada de clonar gente).
-- O gerente NÃO entra aqui: ele gerencia, não é alocado.
CREATE TABLE profissionais (
    pk_profissionalID   INT NOT NULL AUTO_INCREMENT,
    fk_usuarioID        INT NOT NULL,
    ehOperador          TINYINT(1) NOT NULL DEFAULT 0,
    ehMecanico          TINYINT(1) NOT NULL DEFAULT 0,
    especializacao      VARCHAR(100),
    telefone            VARCHAR(50),
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_profissionalID),
    UNIQUE (fk_usuarioID),
    FOREIGN KEY (fk_usuarioID) REFERENCES usuarios(id),
    CONSTRAINT chkProfissionalFuncao CHECK (ehOperador = 1 OR ehMecanico = 1)
);


-- ============================================================
--  SUPRIMENTOS E ESTOQUE
-- ============================================================

CREATE TABLE fornecedores (
    pk_fornecedorID     INT NOT NULL AUTO_INCREMENT,
    nomeFornecedor      VARCHAR(100) NOT NULL,
    cnpj                CHAR(14) NOT NULL,         
    endereco            VARCHAR(300) NOT NULL,
    contato             VARCHAR(50) NOT NULL,
    avaliacao           DECIMAL(2,1),
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_fornecedorID),
    UNIQUE (cnpj)

);

CREATE TABLE materiasPrimas (
    pk_materiaID        INT NOT NULL AUTO_INCREMENT,
    materia             VARCHAR(300) NOT NULL,
    fk_fornecedor       INT NOT NULL,
    unidadeMedida       VARCHAR(20) NOT NULL,                     -- kg, m, un...
    estoqueMinimo       DECIMAL(14,3) NOT NULL DEFAULT 0,         
    quantidadeEstoque   DECIMAL(14,3) NOT NULL DEFAULT 0,         -- saldo atual
    dataUltimaCompra    DATE,
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_materiaID),
    FOREIGN KEY (fk_fornecedor) REFERENCES fornecedores(pk_fornecedorID),
    CONSTRAINT chkMateriaEstoque CHECK (quantidadeEstoque >= 0),  -- saldo negativo? aqui não
    CONSTRAINT chkMateriaMinimo  CHECK (estoqueMinimo >= 0)
);

-- Livro-razão do estoque: toda entrada e saída deixa rastro aqui.
CREATE TABLE movimentacoesEstoque (
    pk_movimentacaoID   INT NOT NULL AUTO_INCREMENT,
    fk_materiaID        INT NOT NULL,
    tipo                ENUM('Entrada', 'Saida') NOT NULL,
    quantidade          DECIMAL(14,3) NOT NULL,
    unidadeMedida       VARCHAR(20) NOT NULL,                     
    fk_usuarioID        INT NOT NULL,                             -- responsável pela operação
    fk_ordemID          INT NULL,                                 -- preenchido nas saídas (conclusão da ordem)
    dataMovimentacao    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao          VARCHAR(300),

    PRIMARY KEY (pk_movimentacaoID),
    FOREIGN KEY (fk_materiaID) REFERENCES materiasPrimas(pk_materiaID),
    FOREIGN KEY (fk_usuarioID) REFERENCES usuarios(id),
    -- Anti baixa duplicada: 1 saída por material por ordem.
    -- Entradas têm fk_ordemID NULL e o MySQL aceita vários NULL num UNIQUE, tudo certo.
    UNIQUE (fk_ordemID, fk_materiaID, tipo),
    CONSTRAINT chkMovQtd   CHECK (quantidade > 0),
    -- Saída só nasce de ordem; entrada é manual
    CONSTRAINT chkMovSaida CHECK (tipo = 'Entrada' OR fk_ordemID IS NOT NULL)
);


-- ============================================================
--  PRODUÇÃO
-- ============================================================

CREATE TABLE pecas (
    pk_pecaID       INT NOT NULL AUTO_INCREMENT,
    peca            VARCHAR(300) NOT NULL,
    peso            VARCHAR(20),
    dimensoes       VARCHAR(30),
    status          ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_pecaID)
);

CREATE TABLE ordensProducao (
    pk_ordemID              INT NOT NULL AUTO_INCREMENT,
    codigo                  VARCHAR(30) NOT NULL,               -- código único
    fk_pecaID               INT NOT NULL,
    quantidadePlanejada     INT NOT NULL,
    especializacao          VARCHAR(100) NOT NULL,              -- especialização exigida
    fk_operadorID           INT NOT NULL,                       -- vem de profissionais
    inicioPlanejado         DATETIME NOT NULL,
    terminoPlanejado        DATETIME NOT NULL,
    inicioEfetivo           DATETIME NULL,                      -- preenchido automático ao iniciar
    conclusaoEfetiva        DATETIME NULL,                      -- preenchido automático ao concluir
    status                  ENUM('Pendente', 'Em Produção', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Pendente',

    PRIMARY KEY (pk_ordemID),
    UNIQUE (codigo),
    FOREIGN KEY (fk_pecaID)      REFERENCES pecas(pk_pecaID),
    FOREIGN KEY (fk_operadorID)  REFERENCES profissionais(pk_profissionalID),
    CONSTRAINT chkOrdemQtd       CHECK (quantidadePlanejada > 0),
    CONSTRAINT chkOrdemPlanejado CHECK (terminoPlanejado > inicioPlanejado),
    -- A conclusão não pode chegar antes do início. 
    -- Por ordem da compania viagem no tempo é expressamente proibida.
    CONSTRAINT chkOrdemEfetivo   CHECK (conclusaoEfetiva IS NULL OR inicioEfetivo IS NULL OR conclusaoEfetiva >= inicioEfetivo),

    -- Índices pro calendário e a checagem de agenda
    INDEX idxOrdemOperadorPeriodo (fk_operadorID, inicioPlanejado, terminoPlanejado),
    INDEX idxOrdemStatus (status)
);

-- Materiais de cada ordem: previsto na criação, consumido efetivo na conclusão (RF04, RF09)
CREATE TABLE ordemMateriais (
    pk_ordemMaterialID  INT NOT NULL AUTO_INCREMENT,
    fk_ordemID          INT NOT NULL,
    fk_materiaID        INT NOT NULL,
    quantidadePrevista  DECIMAL(14,3) NOT NULL,
    quantidadeConsumida DECIMAL(14,3) NULL,                     -- NULL até a ordem concluir

    PRIMARY KEY (pk_ordemMaterialID),
    UNIQUE (fk_ordemID, fk_materiaID),                         
    FOREIGN KEY (fk_ordemID)   REFERENCES ordensProducao(pk_ordemID),
    FOREIGN KEY (fk_materiaID) REFERENCES materiasPrimas(pk_materiaID),
    CONSTRAINT chkOmPrevista  CHECK (quantidadePrevista > 0),
    CONSTRAINT chkOmConsumida CHECK (quantidadeConsumida IS NULL OR quantidadeConsumida >= 0)
);

-- Auditoria de mudança de status das ordens
CREATE TABLE historicoOrdens (
    pk_historicoID  INT NOT NULL AUTO_INCREMENT,
    fk_ordemID      INT NOT NULL,
    fk_usuarioID    INT NOT NULL,
    statusAnterior  VARCHAR(50),
    statusNovo      VARCHAR(50),
    dataAlteracao   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao      VARCHAR(300),

    PRIMARY KEY (pk_historicoID),
    FOREIGN KEY (fk_ordemID)   REFERENCES ordensProducao(pk_ordemID),
    FOREIGN KEY (fk_usuarioID) REFERENCES usuarios(id)
);


-- ============================================================
--  QUALIDADE
-- ============================================================

-- Uma inspeção por ordem, feita na conclusão, com as QUANTIDADES (não peça por peça)
CREATE TABLE inspecoes (
    pk_inspecaoID   INT NOT NULL AUTO_INCREMENT,
    fk_ordemID      INT NOT NULL,
    totalProduzido  INT NOT NULL,
    aprovadas       INT NOT NULL DEFAULT 0,
    rejeitadas      INT NOT NULL DEFAULT 0,
    dataInspecao    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacoes     VARCHAR(300),

    PRIMARY KEY (pk_inspecaoID),
    UNIQUE (fk_ordemID),        
    FOREIGN KEY (fk_ordemID) REFERENCES ordensProducao(pk_ordemID),
    CONSTRAINT chkInspNaoNeg CHECK (totalProduzido >= 0 AND aprovadas >= 0 AND rejeitadas >= 0),
    -- A conta tem que fechar: aprovadas + rejeitadas = produzidas (RN18)
    CONSTRAINT chkInspSoma   CHECK (aprovadas + rejeitadas = totalProduzido)
);

-- Detalha as rejeições: motivo obrigatório, ação corretiva opcional, e se foi retrabalho ou perda definitiva
-- Dica: a soma de `quantidade` aqui deve bater com inspecoes.rejeitadas.
CREATE TABLE rejeicoes (
    pk_rejeicaoID   INT NOT NULL AUTO_INCREMENT,
    fk_inspecaoID   INT NOT NULL,
    quantidade      INT NOT NULL,
    motivoRejeicao  VARCHAR(300) NOT NULL,
    tipo            ENUM('Retrabalho', 'Perda') NOT NULL DEFAULT 'Perda',
    acoesCorretivas VARCHAR(300),
    dataRejeicao    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (pk_rejeicaoID),
    FOREIGN KEY (fk_inspecaoID) REFERENCES inspecoes(pk_inspecaoID),
    CONSTRAINT chkRejQtd CHECK (quantidade > 0)
);


-- ============================================================
--  MANUTENÇÃO
-- ============================================================

CREATE TABLE equipamentos (
    pk_equipamentoID    INT NOT NULL AUTO_INCREMENT,
    nomeEquipamento     VARCHAR(100),
    descricao           VARCHAR(300),
    dataAquisicao       DATE,
    vidaUtilRestante    INT,
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_equipamentoID)
);

CREATE TABLE maquinas (
    pk_maquinaID        INT NOT NULL AUTO_INCREMENT,
    fk_equipamentoID    INT NOT NULL,
    nomeMaquina         VARCHAR(100) NOT NULL,
    descricao           VARCHAR(300),
    capacidadeMaxima    VARCHAR(50) NOT NULL,
    ultimaManutencao    DATE,
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT 'Ativo',

    PRIMARY KEY (pk_maquinaID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID)
);

CREATE TABLE manutencoesProgramadas (
    pk_manutencaoID     INT NOT NULL AUTO_INCREMENT,
    fk_equipamentoID    INT NOT NULL,
    fk_maquinaID        INT NULL,                               -- "máquina quando aplicável"
    tipoManutencao      VARCHAR(100),
    descricao           VARCHAR(300) NOT NULL,
    especializacao      VARCHAR(100) NOT NULL,
    fk_mecanicoID       INT NOT NULL,                           -- vem de profissionais (ehMecanico = 1: valida no service)
    inicioPrevisto      DATETIME NOT NULL,
    terminoPrevisto     DATETIME NOT NULL,
    inicioEfetivo       DATETIME NULL,                          -- automático ao iniciar
    conclusaoEfetiva    DATETIME NULL,                          -- automático ao concluir
    servicosRealizados  VARCHAR(500) NULL,                      -- preenchido na conclusão
    status              ENUM('Programada', 'Em Execução', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Programada',

    PRIMARY KEY (pk_manutencaoID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID),
    FOREIGN KEY (fk_maquinaID)     REFERENCES maquinas(pk_maquinaID),
    FOREIGN KEY (fk_mecanicoID)    REFERENCES profissionais(pk_profissionalID),
    CONSTRAINT chkManutPrevisto CHECK (terminoPrevisto > inicioPrevisto),
    CONSTRAINT chkManutEfetivo  CHECK (conclusaoEfetiva IS NULL OR inicioEfetivo IS NULL OR conclusaoEfetiva >= inicioEfetivo),

    -- Índice pra checar sobreposição de horário do mecânico
    INDEX idxManutMecanicoPeriodo (fk_mecanicoID, inicioPrevisto, terminoPrevisto),
    INDEX idxManutStatus (status)
);

-- Um histórico por manutenção concluída. 
-- Agora com PK própria e a FK separada, em vez do historicoID fazendo dupla jornada de PK + FK.
CREATE TABLE historicoManutencao (
    historicoID             INT NOT NULL AUTO_INCREMENT,
    fk_manutencaoID         INT NOT NULL,
    fk_equipamentoID        INT,
    manutencaoRealizada     VARCHAR(100),
    dataManutencao          DATE NOT NULL,
    custos                  DECIMAL(12,2) NOT NULL DEFAULT 0,   -- dinheiro = 2 casas
    observacoes             VARCHAR(200),

    PRIMARY KEY (historicoID),
    UNIQUE (fk_manutencaoID),         
    FOREIGN KEY (fk_manutencaoID) REFERENCES manutencoesProgramadas(pk_manutencaoID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID),
    CONSTRAINT chkHistCusto CHECK (custos >= 0)
);



CREATE TABLE auditoria (
    pk_auditoriaID  INT NOT NULL AUTO_INCREMENT,
    fk_usuarioID    INT NOT NULL,
    entidade        VARCHAR(50) NOT NULL,       -- 'ordem', 'manutencao', 'profissional'...
    entidadeID      INT NOT NULL,
    acao            VARCHAR(50) NOT NULL,       -- 'reprogramacao', 'cancelamento', 'liberacao'...
    dadosAnteriores JSON NULL,
    dadosNovos      JSON NULL,
    observacao      VARCHAR(300),
    dataAcao        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (pk_auditoriaID),
    FOREIGN KEY (fk_usuarioID) REFERENCES usuarios(id),
    INDEX idxAuditoriaEntidade (entidade, entidadeID)
);