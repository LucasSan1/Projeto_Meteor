import { apiFetch } from "./api"

// Buscar todas ordens
export function getOrdens(){

    return apiFetch("/api/osProducao")

}

// Criar nova ordem
export function createOrdem(data){

    return apiFetch("/api/osProducao", {
        method: "POST",
        body: JSON.stringify(data)
    })

}

export function getPecas() {

  return apiFetch("/api/pecas");

}

// Atualizar status 
export function updateStatusOrdem(
    id,
    data
){
    const body = typeof data === "string" ? { status: data } : data;

    return apiFetch(`/api/osProducao/${id}`, {
        method: "PUT",
        body: JSON.stringify(body)
    })

}

// Editar os dados planejados (só enquanto a ordem está Pendente)
export function updateOrdem(id, data){

    return apiFetch(`/api/osProducao/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })

}