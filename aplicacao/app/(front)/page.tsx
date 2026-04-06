import Headers from "@/app/(front)/components/Header"
import Card from "@/app/(front)/components/Card"
import OrdensRecentes from "@/app/(front)/components/Ordens"
import ManutencoesProximas from "@/app/(front)/components/ManutencoesProximas"

export default function Home() {

  return (

    <div className="p-6 flex flex-col gap-6">

      <Headers />

      {/* CARDS */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        gap-4
      ">

        <Card
          title="Ordens Ativas"
          value={12}
        />

        <Card
          title="Manutenções Pendentes"
          value={5}
        />

      </div>


      {/* TABELAS */}
      <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-6
      ">

        <OrdensRecentes />

        <ManutencoesProximas />

      </div>

    </div>

  )

}