-- consulta 01

SELECT *
FROM inspecoes
WHERE dataInspecao >= CURDATE() - INTERVAL 7 DAY;

-- consulta 02

SELECT 	m.nomeMaquina, 
		COUNT(hp.ordemID) AS QntdProduzida
        
FROM historicoDeProducao hp
JOIN maquinas m ON hp.maquinaID = m.pk_maquinaID
GROUP BY m.nomeMaquina;

-- consulta 03

SELECT *
FROM manutencoesProgramadas
WHERE MONTH(dataProgramada) = MONTH(CURDATE());

-- consulta 04

SELECT 	DISTINCT o.nome

FROM operadores o
JOIN historicoDeProducao hp ON o.pk_operadorID = hp.operadorID
WHERE hp.ordemID IN (SELECT ordemID FROM ordensProducao WHERE fk_pecaID = 1);

-- consulta 05

SELECT *
FROM pecas
ORDER BY peso DESC;

-- consulta 06

SELECT COUNT(*) AS Rejeitadas
FROM rejeicoes
WHERE dataRejeicao BETWEEN '2023-01-01' AND '2023-12-31';

-- consulta 07

SELECT *
FROM fornecedores
ORDER BY nomeFornecedor;

-- consulta 08

SELECT 	m.descricaoMateria, 
		COUNT(p.pk_pecaID) AS QnrdProduzida
        
FROM materiasPrimas m
JOIN 
	pecas p ON m.pk_materiaID = p.fk_material
JOIN 
	historicoDeProducao hp ON p.pk_pecaID = hp.ordemID
GROUP BY m.descricaoMateria;

-- consulta 09

SELECT *
FROM materiasPrimas
WHERE quantidadeEstoque < 10;

-- consulta 10

SELECT *
FROM maquinas
WHERE ultimaManutencao < CURDATE() - INTERVAL 3 MONTH;

-- consulta 11

SELECT 	p.descricaoPeca,
		AVG(ABS(DATEDIFF(op.dataConclusao, op.dataInicio))) AS TempoProducao
        
FROM pecas p
JOIN 
	ordensProducao op ON p.pk_pecaID = op.fk_pecaID
JOIN 
	historicoDeProducao hp ON op.pk_ordemID = hp.ordemID
GROUP BY p.descricaoPeca;

-- consulta 12

SELECT *
FROM inspecoes
WHERE dataInspecao >= CURDATE() - INTERVAL 7 DAY;

-- consulta 13

SELECT 	o.nome, 
		COUNT(hp.ordemID) AS QntdProduzida
        
FROM operadores o
JOIN historicoDeProducao hp ON o.pk_operadorID = hp.operadorID
GROUP BY o.nome
ORDER BY QntdProduzida DESC;

-- consulta 14

SELECT 	p.descricaoPeca, 
		hp.dataProducao, 
		COUNT(hp.ordemID) AS QntdProduzida
        
FROM pecas p
JOIN 
	ordensProducao op ON p.pk_pecaID = op.fk_pecaID
JOIN 
	historicoDeProducao hp ON op.pk_ordemID = hp.ordemID
WHERE 
	hp.dataProducao BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY p.descricaoPeca, hp.dataProducao;

-- consulta 15

SELECT 	f.nomeFornecedor, 
		COUNT(m.pk_materiaID) AS QntdEntregas
        
FROM fornecedores f
JOIN materiasPrimas m ON f.pk_fornecedorID = m.fk_fornecedor
GROUP BY f.nomeFornecedor
ORDER BY QntdEntregas DESC;

-- consulta 16

SELECT 	o.nome, 
		COUNT(hp.ordemID) AS QntdProduzida
        
FROM operadores o
JOIN historicoDeProducao hp ON o.pk_operadorID = hp.operadorID
GROUP BY o.nome;

-- consulta 17

SELECT p.*
FROM pecas p
JOIN inspecoes i ON p.pk_pecaID = i.pecaID
JOIN aceitacoes a ON i.pk_inspecaoID = a.fk_pecaID;

-- consulta 18

SELECT *
FROM manutencoesProgramadas
WHERE MONTH(dataProgramada) = MONTH(CURDATE()) + 1;

-- consulta 19

SELECT SUM(custos) AS CustoTotal

FROM historicoManutencao
WHERE dataManutencao BETWEEN CURDATE() - INTERVAL 3 MONTH AND CURDATE();

-- consulta 20

SELECT p.*

FROM pecas p
JOIN 
	inspecoes i ON p.pk_pecaID = i.pecaID
JOIN 
	rejeicoes r ON i.pk_inspecaoID = r.fk_pecaID
WHERE 
	r.motivoRejeicao > 0.1 AND r.dataRejeicao BETWEEN CURDATE() - INTERVAL 2 MONTH AND CURDATE();