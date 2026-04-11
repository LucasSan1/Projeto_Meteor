import Header from "./components/Header";
import Card from "./components/Card";

export default function Home() {
  return (
    <div
      className="
      min-h-screen
      bg-[#F9F7F4]
      flex
      flex-col
    "
    >
      <Header />

      <div
        className="
        p-6
        flex
        flex-col
        gap-6
      "
      >
        <h1
          className="
          text-2xl
          font-bold
          text-[#4E342E]
        "
        >
          Dashboard
        </h1>

        <div
          className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-4
        "
        >
          <Card title="Ordens em Produção" value={12}>
            <p className="text-sm text-gray-500">
              Ordens atualmente em andamento
            </p>
          </Card>

          <Card title="Ordens Pendentes" value={5}>
            <p className="text-sm text-gray-500">
              Aguardando início de produção
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
