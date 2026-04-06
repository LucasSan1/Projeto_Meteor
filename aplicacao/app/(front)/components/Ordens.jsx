export default function Ordens() {

  const ordens = [
    { id: 1, peca: "Engrenagem", status: "Em Produção" },
    { id: 2, peca: "Parafuso", status: "Pendente" },
    { id: 3, peca: "Eixo", status: "Pronto" }
  ]

  return (

    <div className="
      bg-white
      p-4
      rounded-xl
      shadow-md
      border
    ">

      <h2 className="
        text-lg
        font-semibold
        mb-4
        text-[#4E342E]
      ">
        Ordens Recentes
      </h2>

      <table className="w-full text-sm">

        <thead>
          <tr className="text-left border-b">
            <th>ID</th>
            <th>Peça</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {ordens.map(ordem => (

            <tr key={ordem.id} className="border-b">

              <td>{ordem.id}</td>

              <td>{ordem.peca}</td>

              <td>{ordem.status}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}