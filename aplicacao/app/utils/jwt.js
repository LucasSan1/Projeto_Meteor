import jwt from "jsonwebtoken"

const secretKey = "LoginJWT"

// Função geradora de tokens de acesso (validos por 12hrs)
export function generateToken(email, cargo){
    return jwt.sign({ email, cargo }, secretKey, { algorithm: "HS256", expiresIn: "12h" } )
}

// Função para verificar assinatura e tempo do token
export function isvalid(token){
    try{

        const payload = jwt.verify(token, secretKey);
        return payload
        
    } catch(err){
        return "Token Invalido!"
    }
}