import { generateToken } from "../../../app/utils/jwt";
import { um } from "./banco";

const BASE = "http://localhost";

// Chama o handler da rota do mesmo jeito que o Next faria, sem subir servidor, sem passar pela rede
export async function chamar(
  handler,
  { method = "GET", path = "/api", body, token, params } = {},
) {
  const headers = {};

  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  const request = new Request(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const resposta = await handler(request, { params: params || {} });

  let dados = null;

  try {
    dados = await resposta.json();
  } catch {

  }

  return { status: resposta.status, body: dados };
}

export async function tokenDe(email) {
  const usuario = await um(
    "SELECT email, cargo, tokenversao FROM usuarios WHERE email = $1",
    [email],
  );

  if (!usuario) {
    throw new Error(`Usuário de teste não encontrado: ${email}`);
  }

  return generateToken(usuario.email, usuario.cargo, usuario.tokenversao);
}
