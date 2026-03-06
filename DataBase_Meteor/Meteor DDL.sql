CREATE DATABASE meteor;

USE meteor;

DROP TABLE historicoDeProducao;
DROP TABLE maquinas;
DROP TABLE manutencoesProgramadas;
DROP TABLE historicoManutencao;
DROP TABLE mecanico;
DROP TABLE equipamentos;
DROP TABLE operadores;
DROP TABLE ordensProducao;
DROP TABLE aceitacoes;
DROP TABLE rejeicoes;
DROP TABLE inspecoes;
DROP TABLE pecas;
DROP TABLE materiasPrimas;
DROP TABLE fornecedores;

SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1; 

CREATE TABLE fornecedores (
    pk_fornecedorID     INT NOT NULL,
    nomeFornecedor      VARCHAR(100),
    endereco            VARCHAR(300),
    contato             VARCHAR(50),
    avaliacao           DECIMAL(2,1),
    
    PRIMARY KEY (pk_fornecedorID)
);

CREATE TABLE materiasPrimas (
    pk_materiaID        INT NOT NULL,
    descricaoMateria    VARCHAR(300),
    fk_fornecedor       INT NOT NULL,
    quantidadeEstoque   VARCHAR(30),
    dataUltimaCompra    DATE,
    
    PRIMARY KEY (pk_materiaID),
    FOREIGN KEY (fk_fornecedor) REFERENCES fornecedores(pk_fornecedorID)
);

CREATE TABLE pecas(
	pk_pecaID		INT NOT NULL,
    descricaoPeca	VARCHAR(300),
    fk_material		INT NOT NULL,
    peso			VARCHAR(20),
    Dimensoes		VARCHAR(30),
    
    PRIMARY KEY (pk_pecaID),
    FOREIGN KEY (fk_material) REFERENCES materiasPrimas(pk_materiaID)
);

CREATE TABLE inspecoes (
    pk_inspecaoID       INT NOT NULL AUTO_INCREMENT,
    pecaID           	INT NOT NULL,
    dataInspecao        DATE,
    resultadoInspecao   VARCHAR(50),
    observacoes         VARCHAR(300),
    
    PRIMARY KEY (pk_inspecaoID),
    FOREIGN KEY (pecaID) REFERENCES pecas(pk_pecaID)
);

CREATE TABLE rejeicoes (
    pk_rejeicaoID       INT NOT NULL,
    fk_pecaID           INT,
    motivoRejeicao      VARCHAR(300),
    dataRejeicao        DATE,
    acoesCorretivas     VARCHAR(300),
    
    PRIMARY KEY (pk_rejeicaoID),
    FOREIGN KEY (fk_pecaID) REFERENCES inspecoes(pecaID)
);

CREATE TABLE aceitacoes (
    pk_aceitacaoID      INT NOT NULL,
    fk_pecaID           INT,
    dataAceitacao       DATE,
    destinoPeca         VARCHAR(100),
    observacoes         VARCHAR(300),
    
    PRIMARY KEY (pk_aceitacaoID),
    FOREIGN KEY (fk_pecaID) REFERENCES inspecoes(pecaID)
);

CREATE TABLE ordensProducao (
    pk_ordemID          INT NOT NULL,
    fk_pecaID           INT NOT NULL,
    quantidade          INT NOT NULL DEFAULT 1,
    dataInicio          DATE,
    dataConclusao       DATE,
    statusOrdem         ENUM('Em Produção', 'Pronto', 'Pendente'),
    
    PRIMARY KEY (pk_ordemID),
    FOREIGN KEY (fk_pecaID) REFERENCES pecas(pk_pecaID)
);

CREATE TABLE operadores (
    pk_operadorID       INT NOT NULL,
    nome        		VARCHAR(100),
    especializacao      VARCHAR(100),
    disponibilidade     ENUM('Disponivel', 'Indisponivel'),
    historicoProducao   INT,
    
    PRIMARY KEY (pk_operadorID)
);

CREATE TABLE equipamentos (
    pk_equipamentoID    INT NOT NULL,
    nomeEquipamento     VARCHAR(100),
    descricao           VARCHAR(300),
    dataAquisicao       DATE,
    vidaUtilRestante    DATE,
    
    PRIMARY KEY (pk_equipamentoID)
);

CREATE TABLE mecanico(
	pk_mecanicoID	INT NOT NULL,
    nome			VARCHAR(100),
    telefone		VARCHAR(50),
    
    PRIMARY KEY (pk_mecanicoID)    
);

CREATE TABLE historicoManutencao (
    historicoID      		INT NOT NULL,
    fk_equipamentoID    	INT,
    manutencaoRealizada 	VARCHAR(100),
    dataManutencao      	DATE,
    custos              	DECIMAL(10,5),
    
    PRIMARY KEY (historicoID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID),
    FOREIGN KEY (historicoID)	   REFERENCES manutencoesProgramadas(pk_manutencaoID)
);

CREATE TABLE maquinas (
    pk_maquinaID        INT NOT NULL,
    fk_equipamentoID	INT NOT NULL,
    nomeMaquina         VARCHAR(100),
    descricao           VARCHAR(300),
    capacidadeMaxima    VARCHAR(50),
    ultimaManutencao    DATE,
    
    PRIMARY KEY (pk_maquinaID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID)
);

CREATE TABLE manutencoesProgramadas (
    pk_manutencaoID     INT NOT NULL,
    fk_equipamentoID    INT NOT NULL,
    fk_maquinaID		INT NOT NULL,
    tipoManutencao      VARCHAR(100),
    dataProgramada      DATE,
    responsavel         INT NOT NULL,
    
    PRIMARY KEY (pk_manutencaoID),
    FOREIGN KEY (fk_equipamentoID) 	REFERENCES equipamentos(pk_equipamentoID),
    FOREIGN KEY (responsavel) 		REFERENCES mecanico(pk_mecanicoID),
    FOREIGN KEY (fk_maquinaID)		REFERENCES maquinas(pk_maquinaID)
);

CREATE TABLE historicoDeProducao(
	ordemID			INT NOT NULL,
    operadorID		INT NOT NULL,
    maquinaID		INT NOT NULL,
    dataProducao	DATE,
    
    PRIMARY KEY (ordemID),
    FOREIGN KEY (ordemID) 	 REFERENCES ordensProducao(pk_ordemID),
    FOREIGN KEY (operadorID) REFERENCES operadores(pk_operadorID),
    FOREIGN KEY (maquinaID)  REFERENCES maquinas(pk_maquinaID)
);
