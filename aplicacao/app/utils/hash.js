import bcrypt from "bcrypt";

export async function hashPass(password){
    const salt = 10;

    try{
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;

    } catch(err){
        console.log("Erro ao criptografar senha: ", err)
    }
}