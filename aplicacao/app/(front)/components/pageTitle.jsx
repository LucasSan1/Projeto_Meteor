// Cabeçalho padrão das telas: título, subtítulo e ações no canto direito
// Evita repetir o mesmo bloco em toda página e mantém o ritmo visual do Cosmo
export default function PageTitle({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[#11284F]">{title}</h1>

        {subtitle && (
          <p className="text-sm text-[#697385] mt-0.5">{subtitle}</p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
