import {
  autenticar,
  autorizar,
  autorizarGestor,
  CARGOS,
} from "./authMiddleware";

// Mantém os nomes antigos pra não quebrar as rotas existentes.
// A diferença é que agora a verificação é async e consulta o banco, então toda chamada precisa de await
export async function checkAuth(request) {
  return autenticar(request);
}

// checkAuthPosition continua sendo o "só gestor"
export async function checkAuthPosition(request) {
  return autorizarGestor(request);
}

export { autenticar, autorizar, autorizarGestor, CARGOS };
