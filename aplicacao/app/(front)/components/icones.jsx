// Ícones oficiais do Lucide, a mesma família usada no Cosmo
// Os aliases mantêm o nome antigo pra não sair caçando import em cada tela
import {
  Archive,
  ArrowLeftRight,
  Box,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Clock,
  Cog,
  Gauge,
  History,
  Home,
  KeyRound,
  Layers,
  Menu,
  Package,
  Plus,
  ScrollText,
  TrendingUp,
  TriangleAlert,
  Truck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

export const IconeMenu = Menu;
export const IconeX = X;
export const IconeHome = Home;
export const IconeUsuarios = Users;
export const IconePessoa = UserRound;
export const IconeFornecedor = Truck;
export const IconeMateria = Package;
export const IconePeca = Box;
export const IconeEquipamento = Wrench;
export const IconeMaquina = Cog;
export const IconeOrdem = ClipboardList;
export const IconeInspecao = CircleCheck;
export const IconeRejeicao = TriangleAlert;
export const IconeManutencao = Wrench;
export const IconeMovimentacao = ArrowLeftRight;
export const IconeMateriais = Layers;
export const IconeHistorico = History;
export const IconeAuditoria = ScrollText;
export const IconeSenha = KeyRound;
export const IconeRelogio = Clock;
export const IconeAlerta = TriangleAlert;
export const IconeCheck = CircleCheck;
export const IconeCalendario = CalendarDays;
export const IconeMais = Plus;
export const IconeGauge = Gauge;
export const IconeTendencia = TrendingUp;
export const IconeCaixa = Archive;
export const IconeSeta = ChevronDown;

// Mapa usado pelo menu lateral: cada rota ganha seu desenho
export const ICONES_POR_ROTA = {
  "/": Home,
  "/usuarios": Users,
  "/profissionais": UserRound,
  "/operadores": UserRound,
  "/fornecedores": Truck,
  "/materiasPrimas": Package,
  "/pecas": Box,
  "/equipamentos": Wrench,
  "/maquinas": Cog,
  "/ordemServico": ClipboardList,
  "/inspecoes": CircleCheck,
  "/rejeicoes": TriangleAlert,
  "/manutencoesProgramadas": Wrench,
  "/movimentacoesEstoque": ArrowLeftRight,
  "/ordemMateriais": Layers,
  "/historicoOrdens": History,
  "/historicoManutencao": History,
  "/auditoria": ScrollText,
  "/trocarSenha": KeyRound,
};
