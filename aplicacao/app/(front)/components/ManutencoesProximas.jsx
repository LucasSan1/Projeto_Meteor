export default function ManutencoesProximas() {

  const manutencoes = [
    { id: 1, maquina: "Torno CNC", data: "10/04/2026" },
    { id: 2, maquina: "Fresa", data: "12/04/2026" }
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
        Manutenções Próximas
      </h2>

      <table className="w-full text-sm">

        <thead>
          <tr className="text-left border-b">
            <th>ID</th>
            <th>Máquina</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>

          {manutencoes.map(m => (

            <tr key={m.id} className="border-b">

              <td>{m.id}</td>

              <td>{m.maquina}</td>

              <td>{m.data}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}