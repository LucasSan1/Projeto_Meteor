import { apiFetch } from "./api"

// GET fornecedores
export function getMaquina(){

    return apiFetch("/api/maquinas")

}

// GET equipamento (pro select de adicionar)
export function getEquipamento(){

    return apiFetch("/api/equipamentos")

}

// POST fornecedores
export function createMaquina(data){

    return apiFetch("/api/maquinas", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

export function deleteMaquina(id){
    return apiFetch(`/api/maquinas/${id}`, {
        method: "PUT"
    })
}