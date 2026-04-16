import { apiFetch } from "./api"

// Buscar todos os operadores
export function getOperators(){

    return apiFetch("/api/operadores")

}

// Criar operador
export function createOperator(data){

    return apiFetch("/api/operadores", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

// DELETE (desativar)
export function deleteOperador(id){

    return apiFetch(`/api/operadores/${id}`, {
        method: "DELETE"
    })

}

// ATIVAR operador
export function activateOperador(id){

    return apiFetch(`/api/operadores/${id}`, {
        method: "POST"
    })

}

export function changeAvailability(id){
    return apiFetch(`/api/operadores/${id}`, {
        method: "PUT"
    })
}