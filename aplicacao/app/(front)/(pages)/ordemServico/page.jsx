"use client"

import { useEffect, useState } from "react"

import { getOrdens } from "../../services/orderService"

export default function OrdemServico(){

    const [ordens, setOrdens] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        async function carregar(){

            const response = await getOrdens()

            if (response){

                setOrdens(response.data)

            }

            setLoading(false)

        }

        carregar()

    }, [])

    if (loading){
        return <p>Carregando ordens...</p>
    }

    return(

        <div>

            <h1>Ordens de Produção</h1>

            {ordens.map(ordem => (

                <div key={ordem.pk_ordemID}>

                    <p>
                        Peça: {ordem.fk_pecaID}
                    </p>

                    <p>
                        Quantidade: {ordem.quantidade}
                    </p>

                    <p>
                        Status: {ordem.status}
                    </p>

                    <hr/>

                </div>

            ))}

        </div>

    )

}