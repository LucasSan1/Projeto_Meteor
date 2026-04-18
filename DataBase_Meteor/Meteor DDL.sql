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
DROP TABLE usuarios;

SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1; 

CREATE TABLE usuarios (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL,
    email   VARCHAR(200) UNIQUE NOT NULL,
    cargo   ENUM('gerente', 'operador', 'mecanico') NOT NULL DEFAULT "operador",
    senha   VARCHAR(200) NOT NULL, 
    status  ENUM('Ativo', "Desativado") NOT NULL DEFAULT "Ativo"
);


CREATE TABLE fornecedores (
    pk_fornecedorID     INT NOT NULL AUTO_INCREMENT,
    nomeFornecedor      VARCHAR(100) NOT NULL,
    endereco            VARCHAR(300) NOT NULL,
    contato             VARCHAR(50) NOT NULL,
    avaliacao           DECIMAL(2,1),
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT "Ativo",
    
    PRIMARY KEY (pk_fornecedorID)
);

CREATE TABLE materiasPrimas (
    pk_materiaID        INT NOT NULL AUTO_INCREMENT,
    materia             VARCHAR(300) NOT NULL,
    fk_fornecedor       INT NOT NULL,
    quantidadeEstoque   VARCHAR(30) DEFAULT "0",
    dataUltimaCompra    DATE,
    status              ENUM('Ativo', "Desativado") NOT NULL DEFAULT "Ativo",
    
    PRIMARY KEY (pk_materiaID),
    FOREIGN KEY (fk_fornecedor) REFERENCES fornecedores(pk_fornecedorID)
);

CREATE TABLE pecas(
	pk_pecaID		INT NOT NULL AUTO_INCREMENT,
    peca	        VARCHAR(300) NOT NULL,
    fk_material		INT NOT NULL,
    peso			VARCHAR(20),
    Dimensoes		VARCHAR(30),
    status          ENUM('Ativo', "Desativado") NOT NULL DEFAULT "Ativo",
    
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
    pk_rejeicaoID       INT NOT NULL AUTO_INCREMENT,
    fk_inspecaoID       INT,
    motivoRejeicao      VARCHAR(300),
    dataRejeicao        DATE,
    acoesCorretivas     VARCHAR(300),

    PRIMARY KEY (pk_rejeicaoID),
    FOREIGN KEY (fk_inspecaoID) 
    REFERENCES inspecoes(pk_inspecaoID)
);

CREATE TABLE aceitacoes (
    pk_aceitacaoID      INT NOT NULL AUTO_INCREMENT,
    fk_inspecaoID       INT,
    dataAceitacao       DATE,
    destinoPeca         VARCHAR(100),
    observacoes         VARCHAR(300),

    PRIMARY KEY (pk_aceitacaoID),
    FOREIGN KEY (fk_inspecaoID) 
    REFERENCES inspecoes(pk_inspecaoID)
);



CREATE TABLE ordensProducao (
    pk_ordemID          INT NOT NULL AUTO_INCREMENT,
    fk_pecaID           INT NOT NULL,
    quantidade          INT NOT NULL DEFAULT 1,
    dataInicio          DATE,
    dataConclusao       DATE,
    fk_responsavel      INT,
    status              ENUM('Em Produção', 'Pronto', 'Pendente', 'Cancelado') NOT NULL DEFAULT "Pendente",
    
    PRIMARY KEY (pk_ordemID),
    FOREIGN KEY (fk_pecaID) REFERENCES pecas(pk_pecaID),
    FOREIGN KEY (fk_responsavel) REFERENCES usuarios(id);
);

CREATE TABLE operadores (
    pk_operadorID       INT NOT NULL AUTO_INCREMENT,
    nome        		VARCHAR(100) NOT NULL,
    especializacao      VARCHAR(100),
    disponibilidade     ENUM('Disponivel', 'Indisponivel') NOT NULL DEFAULT "Disponivel",
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT "Ativo",

    PRIMARY KEY (pk_operadorID)
);

CREATE TABLE equipamentos (
    pk_equipamentoID    INT NOT NULL AUTO_INCREMENT,
    nomeEquipamento     VARCHAR(100),
    descricao           VARCHAR(300),
    dataAquisicao       DATE,
    vidaUtilRestante    INT,
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT "Ativo",
    
    PRIMARY KEY (pk_equipamentoID)
);

CREATE TABLE mecanico(
	pk_mecanicoID	INT NOT NULL AUTO_INCREMENT,
    nome			VARCHAR(100) NOT NULL,
    telefone		VARCHAR(50) NOT NULL,
    status          ENUM('Ativo', 'Desativado') NOT NULL DEFAULT "Ativo",
    
    PRIMARY KEY (pk_mecanicoID)    
);


CREATE TABLE maquinas (
    pk_maquinaID        INT NOT NULL AUTO_INCREMENT,
    fk_equipamentoID	INT NOT NULL,
    nomeMaquina         VARCHAR(100) NOT NULL,
    descricao           VARCHAR(300),
    capacidadeMaxima    VARCHAR(50) NOT NULL,
    ultimaManutencao    DATE,
    status              ENUM('Ativo', 'Desativado') NOT NULL DEFAULT "Ativo",
    
    PRIMARY KEY (pk_maquinaID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID)
);

CREATE TABLE manutencoesProgramadas (
    pk_manutencaoID     INT NOT NULL AUTO_INCREMENT,
    fk_equipamentoID    INT NOT NULL,
    fk_maquinaID		INT NOT NULL,
    tipoManutencao      VARCHAR(100),
    dataProgramada      DATE NOT NULL ,
    responsavel         INT NOT NULL,
    status              ENUM('Pendente', 'Realizada', 'Cancelada') NOT NULL DEFAULT "Pendente", 
    
    PRIMARY KEY (pk_manutencaoID),
    FOREIGN KEY (fk_equipamentoID) 	REFERENCES equipamentos(pk_equipamentoID),
    FOREIGN KEY (responsavel) 		REFERENCES mecanico(pk_mecanicoID),
    FOREIGN KEY (fk_maquinaID)		REFERENCES maquinas(pk_maquinaID)
);

CREATE TABLE historicoManutencao (
    historicoID      		INT NOT NULL AUTO_INCREMENT,
    fk_equipamentoID    	INT,
    manutencaoRealizada 	VARCHAR(100),
    dataManutencao      	DATE NOT NULL,
    custos              	DECIMAL(10,5),
    observacoes             VARCHAR(200),
    
    PRIMARY KEY (historicoID),
    FOREIGN KEY (fk_equipamentoID) REFERENCES equipamentos(pk_equipamentoID),
    FOREIGN KEY (historicoID)	   REFERENCES manutencoesProgramadas(pk_manutencaoID)
);

CREATE TABLE historicoOrdens (
    pk_historicoID INT NOT NULL AUTO_INCREMENT,
    fk_ordemID INT NOT NULL,
    fk_usuarioID INT NOT NULL,
    statusAnterior VARCHAR(50),
    statusNovo VARCHAR(50),
    dataAlteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(300),

    PRIMARY KEY (pk_historicoID),
    FOREIGN KEY (fk_ordemID) REFERENCES ordensProducao(pk_ordemID),
    FOREIGN KEY (fk_usuarioID) REFERENCES usuarios(id)
);