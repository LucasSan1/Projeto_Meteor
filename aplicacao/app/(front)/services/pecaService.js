import { apiFetch } from "./api"

// GET peças
export function getPecas(){

    return apiFetch("/api/pecas")

}

// POST peça
export function createPeca(data){

    return apiFetch("/api/pecas", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

// PATCH peça
export function updatePeca(id, data){

    return apiFetch(`/api/pecas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })

}

// DELETE (desativar)
export function deletePeca(id){

    return apiFetch(`/api/pecas/${id}`, {
        method: "DELETE"
    })

}

// ATIVAR peça
export function activatePeca(id){

    return apiFetch(`/api/pecas/${id}`, {
        method: "POST"
    })

}