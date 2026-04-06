import Swal from "sweetalert2"

export function alertUnauthorized(){

    Swal.fire({
        icon: "warning",
        title: "Sessão expirada",
        text: "Sua sessão expirou. Faça login novamente.",
        confirmButtonText: "Ir para login",
        allowOutsideClick: false
    }).then(() => {

        localStorage.removeItem("token")

        window.location.href = "/login"

    })

}

export function alertForbidden(){

    Swal.fire({
        icon: "error",
        title: "Acesso negado",
        text: "Você não tem permissão para acessar esta funcionalidade.",
        confirmButtonText: "OK"
    })

}