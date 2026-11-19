import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuthPosition } from "../../utils/authChecker";
import { registrarAuditoria } from "../../utils/auditoria";
import {
    comPaginacao,
    contarLinhas,
    lerPaginacao,
    paramsComPaginacao,
    respostaLista,
} from "../../utils/paginacao";

// Função para salvar um novo fornecedor no banco
export async function POST(request){
    try{

        // Verifica o token com base no cargo
        const usuario = await checkAuthPosition(request)

        // Extrai o json e valida os campos
        const body = await request.json();
        const { nome, cnpj, endereco, contato, avaliacao } = body;

        if (!nome || !cnpj || !endereco || !contato ){
            return NextResponse.json(
                { message: "Nome, CNPJ, endereço e contato não devem estar vazios!"},
                { status: 400}
            )
        }

        // CNPJ entra só com números (o CHAR(14) do banco não curte máscara)
        const cnpjLimpo = String(cnpj).replace(/\D/g, "");

        if (cnpjLimpo.length !== 14) {
            return NextResponse.json(
                { message: "O CNPJ deve ter 14 dígitos!" },
                { status: 400 }
            )
        }

        // Se não tiver avaliacao no json ela vira 0
        const aval = avaliacao === undefined || avaliacao === "" ? 0 : Number(avaliacao)

        // DECIMAL(2,1) só aceita de 0 a 9.9, então o 10 não pode escapar daqui
        if (!Number.isFinite(aval) || aval < 0 || aval > 9.9) {
            return NextResponse.json(
                { message: "A avaliação deve ficar entre 0 e 9.9!" },
                { status: 400 }
            )
        }

        // Insere informaçoes no banco
        const [result] = await pool.query(
            "INSERT INTO fornecedores (nomeFornecedor, cnpj, endereco, contato, avaliacao) VALUES (?, ?, ?, ?, ?)",
            [nome, cnpjLimpo, endereco, contato, aval]
        ) 

        await registrarAuditoria(pool, {
            usuarioID: usuario.id,
            entidade: "fornecedor",
            entidadeID: result.insertId,
            acao: "criacao",
            dadosNovos: {
                nome,
                cnpj: cnpjLimpo,
                endereco,
                contato,
                avaliacao: aval,
            },
            observacao: "Fornecedor cadastrado",
        });

        return NextResponse.json({
            message: "Fornecedor cadastrado com sucesso!",
            id: result.insertId
        });

    } catch(err){
        console.log("Fornecedores POST : ", err)

        if(err.code === "ER_DUP_ENTRY"){
            return NextResponse.json(
                { message: "Já existe um fornecedor com esse CNPJ!" },
                { status: 409 }
            )
        }

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro do servidor! "},
            { status: 500 }
        )
    }
}

// Função para retornar todos os fornecedores cadastrados
export async function GET(request){
    try{

        // Apenas verifica se o token é valido e não expirou, ignorando o cargo
        await checkAuthPosition(request)

        const paginacao = lerPaginacao(request);

        const consulta = paginacao
            ? "SELECT * FROM fornecedores ORDER BY pk_fornecedorID"
            : "SELECT * FROM fornecedores";

        const [result] = await pool.query(
            comPaginacao(consulta, paginacao),
            paramsComPaginacao([], paginacao),
        )

        const total = paginacao
            ? await contarLinhas(pool, "SELECT COUNT(*) AS total FROM fornecedores")
            : null;

        return NextResponse.json(
            respostaLista(result, paginacao, total),
            { status: 200 }
        )

    } catch(err){
        console.log("Fornecedores GET: ", err)

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro do servidor! "},
            { status: 500 }
        )

    }
}
