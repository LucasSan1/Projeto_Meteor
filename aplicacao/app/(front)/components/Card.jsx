export default function Card({ title, value, children }) {
  return (
    <div
      className="
      bg-white
      p-4
      md:p-5
      rounded-xl
      border
      border-[#334E7F]/10
      flex
      flex-col
      gap-2
      transition-shadow
      hover:shadow-md
    "
    >
      {title && (
        <span className="text-sm font-semibold text-[#11284F]">
          {title}
        </span>
      )}

      {value !== undefined && value !== null && value !== "" && (
        <span
          className="
          text-3xl
          font-bold
          text-[#11284F]
          leading-tight
        "
        >
          {value}
        </span>
      )}

      {children && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  );
}
