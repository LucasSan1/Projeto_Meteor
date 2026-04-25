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
    status
){
    return apiFetch(`/api/osProducao/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            status
        })
    })

}