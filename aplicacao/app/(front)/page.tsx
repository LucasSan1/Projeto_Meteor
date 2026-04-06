import Header from "./components/Header"
import Card from "./components/Card"

export default function Home() {

  return (

    <div className="
      min-h-screen
      bg-[#F9F7F4]
      flex
      flex-col
    ">

    <Header />

      <div className="
        p-6
        flex
        flex-col
        gap-6
      ">

      
        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          gap-4
        ">

          <Card
            title="Ordens em Produção"
            value={12}
          />

          <Card
            title="Manutenções Pendentes"
            value={5}
          />

        </div>

      </div>

    </div>

  )

}