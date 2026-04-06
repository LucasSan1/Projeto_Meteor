export default function Card({ title, value }) {

  return (

    <div className="
      bg-white
      p-4
      rounded-xl
      shadow-md
      flex
      flex-col
      gap-2
      border
    ">

      <span className="text-sm text-gray-500">
        {title}
      </span>

      <span className="
        text-3xl
        font-bold
        text-[#4E342E]
      ">
        {value}
      </span>

    </div>

  )

}