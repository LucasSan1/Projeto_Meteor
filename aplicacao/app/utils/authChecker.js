import { isvalid } from "../utils/jwt";

export function checkAuth(request){

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        throw { status: 401, message: "Token não informado!" };
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = isvalid(token);

    if (payload.cargo !== "gerente") {
        throw { status: 403, message: "Acesso negado!" };
    }

    return payload;
}