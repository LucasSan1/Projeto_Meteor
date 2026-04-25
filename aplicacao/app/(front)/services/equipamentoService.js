import { apiFetch } from "./api"

// GET equipamento
export function getEquipamento(){

    return apiFetch("/api/equipamentos")

}

// POST equipamneot
export function createEquipamento(data){

    return apiFetch("/api/equipamentos", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

// PATCH equipamento
export function updateEquipamento(id, data){

    return apiFetch(`/api/equipamentos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })

}

// DELETE (desativar)
export function deleteEquipamento(id){

    return apiFetch(`/api/equipamentos/${id}`, {
        method: "DELETE"
    })

}

// ATIVAR equipamento
export function activateEquipamento(id){

    return apiFetch(`/api/equipamentos/${id}`, {
        method: "PUT"
    })

}