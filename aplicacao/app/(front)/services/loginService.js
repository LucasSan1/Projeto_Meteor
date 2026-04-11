import { apiFetch } from "./api"

export function loginService(data){

    return apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true
    })

}