import Swal from "sweetalert2"

export async function apiFetch(
    url,
    options = {}
){

    const token = localStorage.getItem("token")

    try{

        const response = await fetch(url, {

            ...options,

            headers: {
                "Content-Type": "application/json",

                Authorization: token
                    ? `Bearer ${token}`
                    : "",

                ...(options.headers || {})
            }

        })

        if(response.status === 401){

            const data = await response.json()

            await Swal.fire({
                icon: "warning",
                title: "Sessão inválida",
                text: data.message
            })

            localStorage.removeItem("token")

            window.location.href = "/login"

            return null
        }

        if(response.status === 403){

            const data = await response.json()

            await Swal.fire({
                icon: "error",
                title: "Acesso negado",
                text: data.message
            })

            return null
        }

        return await response.json()

    } catch(err){

        console.error("Erro API:", err)

        await Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Erro ao conectar com servidor."
        })

        return null
    }

}