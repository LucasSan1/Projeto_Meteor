import { apiFetch } from "./api"

// GET fornecedores
export function getFornecedore(){

    return apiFetch("/api/fornecedores")

}

// POST fornecedores
export function createFornecedor(data){

    return apiFetch("/api/fornecedores", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

// PATCH fornecedores
export function updateFornecedor(id, data){

    return apiFetch(`/api/fornecedores/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })

}

// DELETE (desativar)
export function deleteFornecedor(id){

    return apiFetch(`/api/fornecedores/${id}`, {
        method: "DELETE"
    })

}

// ATIVAR fornecedor
export function activateFornecedor(id){

    return apiFetch(`/api/fornecedores/${id}`, {
        method: "PUT"
    })

}