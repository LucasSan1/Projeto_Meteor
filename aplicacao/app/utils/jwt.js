import jwt from "jsonwebtoken"

function getSecretKey() {
    const secretKey = process.env.JWT_SECRET

    if (!secretKey) {
        throw new Error("JWT_SECRET não configurado no ambiente!")
    }

    return secretKey
}

// Função geradora de tokens de acesso (validos por 12hrs)
export function generateToken(email, cargo, versao = 0){
    return jwt.sign({ email, cargo, versao }, getSecretKey(), { algorithm: "HS256", expiresIn: "12h" } )
}

// Função para verificar assinatura e tempo do token
export function isvalid(token){
    const secretKey = getSecretKey()

    try{
        
        const replacedToken = token.replace("Bearer ", "")

        const payload = jwt.verify(replacedToken, secretKey);
        return payload
        
    } catch(err){
        console.log("erro ao validar token: ", err)

        if(err.name === "TokenExpiredError"){
            return "TokenExpiredError"
        } 

        return "JsonWebTokenError"
    }
}
