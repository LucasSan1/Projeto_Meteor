import { isvalid } from "../utils/jwt";

export function checkAuthPosition(request){

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        throw { status: 401, message: "Token não informado!" };
    }

    const payload = isvalid(authHeader);

    if(payload === "TokenExpiredError"){
        throw { status: 401, message: "Token expirado!" }
    }

    if(payload === "JsonWebTokenError"){
        throw { status: 401, message: "Não Autorizado!" };
    }

    if (payload.cargo !== "gerente") {
        throw { status: 403, message: "Acesso negado!" };
    }

    return payload;
}

export function checkAuth(request){

    const authHeader = request.headers.get("authorization");

    if(!authHeader){
        throw { status: 401, message: "Token não informado!" }
    }

    const payload = isvalid(authHeader);

    if(payload === "TokenExpiredError"){
        throw { status: 401, message: "Token expirado!" }
    } 
    
    if(payload === "JsonWebTokenError"){
        throw { status: 401, message: "Não Autorizado!" };
    }

    return payload
}