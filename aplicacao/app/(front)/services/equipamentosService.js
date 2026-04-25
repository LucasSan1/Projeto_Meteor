import { apiFetch } from "./api"

// GET equipamento
export function getEquipamentos(){

    return apiFetch("/api/equipamentos")

}

// POST equipamneot
export function createEquipamentos(data){

    return apiFetch("/api/equipamentos", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

// PATCH equipamento
export function updateEquipamentos(id, data){

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