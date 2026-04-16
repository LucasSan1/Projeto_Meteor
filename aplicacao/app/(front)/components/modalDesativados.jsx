"use client";

export default function ModalDesativados({
  title = "Registros Desativados",
  items = [],
  idField = "id",
  displayFields = [],
  onActivate,
  onClose,
}) {
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
        <h2 className=" text-lg font-bold text-[#4E342E]">{title}</h2>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Nenhum registro desativado
            </p>
          )}

          {items.map((item) => (
            <div
              key={item[idField]}
              className="border rounded p-3 flex justify-between items-center"
            >
              <div className="flex flex-col">
                {displayFields.map((field) => (
                  <span key={field} className="text-sm text-black">
                    {item[field]}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onActivate(item[idField])}
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              >
                Ativar
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
