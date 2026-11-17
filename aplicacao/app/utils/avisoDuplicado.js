import Swal from "sweetalert2";
import { mascararCnpj, mascararTelefone, somenteDigitos } from "./mascaras";


export async function avisarDuplicado({
  registros = [],
  valor,
  campo,
  campoID,
  nome,
  tipo = "telefone",
  ignorarID = null,
}) {
  const alvo = somenteDigitos(valor);

  if (!alvo) return false;

  const repetido = registros.find(
    (registro) =>
      Number(registro[campoID]) !== Number(ignorarID) &&
      somenteDigitos(registro[campo]) === alvo,
  );

  if (!repetido) return false;

  const ehCnpj = tipo === "cnpj";
  const numero = ehCnpj ? mascararCnpj(alvo) : mascararTelefone(alvo);

  await Swal.fire({
    icon: "warning",
    title: ehCnpj ? "CNPJ já cadastrado" : "Telefone já cadastrado",
    text: ehCnpj
      ? `${numero} já pertence a "${repetido[nome]}". Cada fornecedor precisa de um CNPJ único!`
      : `${numero} já pertence a "${repetido[nome]}". Cada profissional precisa de um telefone único!`,
  });

  return true;
}
