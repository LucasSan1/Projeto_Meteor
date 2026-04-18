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
export function deleteOperator(id){

    return apiFetch(`/api/operadores/${id}`, {
        method: "DELETE"
    })

}

// ATIVAR operador
export function activateOperator(id){

    return apiFetch(`/api/operadores/${id}`, {
        method: "POST"
    })

}

export function changeAvailability(id){
    return apiFetch(`/api/operadores/${id}`, {
        method: "PUT"
    })
}

export function updateOperator(id, data){

    return apiFetch(`/api/operadores/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })
}