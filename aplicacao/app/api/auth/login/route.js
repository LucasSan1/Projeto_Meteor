import { NextResponse } from "next/server";
import  pool  from "../../../lib/connSql";
import bcrypt from "bcrypt"
import { generateToken } from "../../../utils/jwt"
import { hashPass } from "../../../utils/hash"
import { autenticar } from "../../../utils/authMiddleware"

export async function POST(request) {
    try {
        const body = await request.json();
        
        const { email, senha } = body;

        const [result]  = await pool.query(
            "SELECT email, senha, nome, cargo, status FROM usuarios WHERE email = ?",
            [email]
        )

        // Comparação de senha
        const user = result[0];
        const hash = user ? user.senha : "$2b$10$pt2dUAb.Fx1MfPQ.Y68U/u6SE9e3TDYvCN6WvxANTIwWMAcV0EMRa"
        const validatedPass = await bcrypt.compare(senha, hash);

        // Validacao de email, senha e status (usuário desativado não entra)
        if(!user || !validatedPass || user.status !== "Ativo") {
             return NextResponse.json(
                { message: "Usuario ou senha invalidos!" },
                { status: 401 }
            )
        }

        const token = generateToken(user.email, user.cargo)

        return NextResponse.json(
            { token: token, cargo: user.cargo, usuario: user.nome },
            { status: 200}
        )
        
    } catch (err) {
        console.error(err);

        return NextResponse.json(
        { message: "Erro ao logar usuário" },
        { status: 500 }
        );
    }
}

// Rota para atualizar senha
export async function PUT(request){
    try{
        const usuarioLogado = await autenticar(request);

        const body = await request.json();
        const { senhaAtual, novaSenha } = body;

        if(!senhaAtual || !novaSenha?.trim()){
            throw { status: 400, message: "Informe a senha atual e a nova senha!" };
        }

        const [user] = await pool.query(
            "SELECT senha FROM usuarios WHERE email = ?",
            [usuarioLogado.email]
        )

        // Verifica se o usuario existe e retorna msg generica (mensagem correta no console da api)
        if(user.length === 0){
            console.log("usuario não encontrado")

            return NextResponse.json(
                { message: "Não foi possivel atualizar a senha" },
                { status: 404 }
            )
        }

        const senhaBanco = user[0].senha;

        const senhaValida = await bcrypt.compare(senhaAtual, senhaBanco);

        if(!senhaValida){
            console.log("Senha antiga invalida")
            return NextResponse.json(
                { message: "Não foi possivel atualizar a senha" },
                { status: 401 }
            )
        }

        const hashedPass = await hashPass(novaSenha);

        await pool.query(
            "UPDATE usuarios SET senha = ? WHERE email = ?",
            [hashedPass, usuarioLogado.email]
        )

        return NextResponse.json(
            { message: "Senha atualizada" },
            { status: 200 }
        )

    } catch(err){
        console.error(err);

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro ao atualizar senha" },
            { status: 500 }
        )
    }
}