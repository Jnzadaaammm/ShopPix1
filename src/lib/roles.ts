import { prisma } from "@/lib/db";

/**
 * Cargos padrão do sistema.
 * Cargos de cliente têm desconto escalonado.
 * Cargos de equipe têm permissões administrativas.
 */
export const DEFAULT_ROLES = [
  // === Cargos de Cliente ===
  {
    name: "Bronze",
    description: "Cargo inicial para novos clientes",
    type: "CLIENT",
    level: 0,
    discount: 0,
    color: "orange",
    isDefault: true,
    permissions: "[]",
  },
  {
    name: "Prata",
    description: "Cliente recorrente — 5% de desconto",
    type: "CLIENT",
    level: 1,
    discount: 5,
    color: "gray",
    isDefault: false,
    permissions: "[]",
  },
  {
    name: "Ouro",
    description: "Cliente VIP — 10% de desconto",
    type: "CLIENT",
    level: 2,
    discount: 10,
    color: "gold",
    isDefault: false,
    permissions: "[]",
  },
  {
    name: "Diamante",
    description: "Cliente premium — 15% de desconto",
    type: "CLIENT",
    level: 3,
    discount: 15,
    color: "blue",
    isDefault: false,
    permissions: "[]",
  },
  // === Cargos de Equipe ===
  {
    name: "Suporte",
    description: "Atende tickets de suporte",
    type: "TEAM",
    level: 10,
    discount: 0,
    color: "green",
    isDefault: false,
    permissions: "[]",
  },
  {
    name: "Moderador",
    description: "Atende tickets de suporte",
    type: "TEAM",
    level: 20,
    discount: 0,
    color: "purple",
    isDefault: false,
    permissions: "[]",
  },
  {
    name: "Dono",
    description: "Dono da loja — acesso absoluto e exclusivo",
    type: "TEAM",
    level: 999,
    discount: 100,
    color: "gold",
    isDefault: false,
    permissions: '["*"]',
  },
] as const;

/**
 * Garante que os cargos padrão existam no banco.
 * Executado na inicialização ou via seed.
 */
export async function ensureDefaultRoles() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        type: role.type,
        level: role.level,
        discount: role.discount,
        color: role.color,
        permissions: role.permissions,
      },
      create: {
        name: role.name,
        description: role.description,
        type: role.type,
        level: role.level,
        discount: role.discount,
        color: role.color,
        isDefault: role.isDefault,
        permissions: role.permissions,
      },
    });
  }
}

/**
 * Mapeamento de cores do cargo para classes Tailwind.
 */
export const ROLE_COLOR_CLASSES: Record<string, { badge: string; text: string; bg: string }> = {
  gray: {
    badge: "bg-slate-900 text-slate-300",
    text: "text-slate-400",
    bg: "bg-slate-900",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700",
    text: "text-blue-600",
    bg: "bg-blue-100",
  },
  green: {
    badge: "bg-green-100 text-green-700",
    text: "text-green-600",
    bg: "bg-green-100",
  },
  purple: {
    badge: "bg-purple-100 text-purple-700",
    text: "text-purple-600",
    bg: "bg-purple-100",
  },
  gold: {
    badge: "bg-yellow-100 text-yellow-800",
    text: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  orange: {
    badge: "bg-orange-100 text-orange-700",
    text: "text-orange-600",
    bg: "bg-orange-100",
  },
  red: {
    badge: "bg-red-100 text-red-700",
    text: "text-red-600",
    bg: "bg-red-100",
  },
};

export function getRoleColorClass(color: string) {
  return ROLE_COLOR_CLASSES[color] || ROLE_COLOR_CLASSES.gray;
}

/**
 * Lista de todas as permissões possíveis no sistema.
 */
export const ALL_PERMISSIONS = [
  { id: "*", label: "Acesso Total" },
  { id: "products.manage", label: "Gerenciar Produtos" },
  { id: "orders.view", label: "Ver Pedidos" },
  { id: "orders.manage", label: "Gerenciar Pedidos" },
  { id: "customers.view", label: "Ver Clientes" },
  { id: "customers.manage", label: "Gerenciar Clientes" },
  { id: "categories.manage", label: "Gerenciar Categorias" },
  { id: "coupons.manage", label: "Gerenciar Cupons" },
  { id: "reports.view", label: "Ver Relatórios" },
  { id: "refunds.manage", label: "Gerenciar Reembolsos" },
  { id: "settings.manage", label: "Gerenciar Configurações" },
  { id: "roles.manage", label: "Gerenciar Cargos" },
] as const;

/**
 * Verifica o total gasto por um usuário e promove seu cargo automaticamente.
 * Limite de gastos por cargo (em R$):
 * - Bronze: 0 (padrão)
 * - Prata: R$ 10+
 * - Ouro: R$ 50+
 * - Diamante: R$ 100+
 *
 * Só promove cargos de CLIENTE — nunca despromove um cargo de EQUIPE.
 */
export const ROLE_SPEND_THRESHOLDS: { roleName: string; minSpend: number }[] = [
  { roleName: "Diamante", minSpend: 100 },
  { roleName: "Ouro", minSpend: 50 },
  { roleName: "Prata", minSpend: 10 },
];

export async function checkAndUpgradeRole(userId: string): Promise<{
  upgraded: boolean;
  newRoleName?: string;
  oldRoleName?: string;
}> {
  // Calcular total gasto em pedidos PAID
  const orders = await prisma.order.findMany({
    where: { userId, status: "PAID" },
    select: { total: true },
  });
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  // Buscar cargos atuais do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return { upgraded: false };

  // Separar cargos de cliente e equipe
  const clientRoles = user.roles
    .map((ur) => ur.role)
    .filter((r) => r.type === "CLIENT");
  const teamRoles = user.roles
    .map((ur) => ur.role)
    .filter((r) => r.type === "TEAM");

  // Não promover se tem cargo de equipe
  if (teamRoles.length > 0) return { upgraded: false };

  // Cargo de cliente atual (maior nível)
  const currentClientRole = clientRoles.reduce(
    (top, r) => (r.level > top.level ? r : top),
    clientRoles[0] ?? { name: "Nenhum", level: -1 }
  );

  // Encontrar cargo elegível baseado no total gasto
  let targetRoleName: string | null = null;
  for (const threshold of ROLE_SPEND_THRESHOLDS) {
    if (totalSpent >= threshold.minSpend) {
      targetRoleName = threshold.roleName;
      break;
    }
  }

  if (!targetRoleName) return { upgraded: false };

  // Se já tem o cargo, não promover
  if (currentClientRole.name === targetRoleName) return { upgraded: false };

  const targetRole = await prisma.role.findUnique({
    where: { name: targetRoleName },
  });
  if (!targetRole) return { upgraded: false };

  // Verificar se é upgrade
  if (targetRole.level <= (currentClientRole.level ?? 0)) return { upgraded: false };

  // Promover: remover cargos de cliente antigos e adicionar o novo
  const oldRoleName = currentClientRole.name || "Nenhum";

  // Remover todos os cargos de cliente atuais
  for (const cr of clientRoles) {
    await prisma.userRole.deleteMany({
      where: { userId, roleId: cr.id },
    });
  }
  // Adicionar novo cargo
  await prisma.userRole.create({
    data: { userId, roleId: targetRole.id },
  }).catch(() => {}); // ignora duplicata

  return {
    upgraded: true,
    newRoleName: targetRole.name,
    oldRoleName,
  };
}

/**
 * Verifica se um usuário (com role) tem uma permissão específica.
 */
export function hasPermission(
  userPermissions: string[] | null,
  isAdmin: boolean,
  permission: string
): boolean {
  if (isAdmin) return true;
  if (!userPermissions) return false;
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(permission);
}

/**
 * Parseia as permissões de um cargo (string JSON) para array.
 */
export function parsePermissions(permissions: string): string[] {
  try {
    return JSON.parse(permissions);
  } catch {
    return [];
  }
}

/**
 * Verifica no banco se o usuário autenticado tem uma permissão.
 * Busca o cargo atual do usuário (não confia só na sessão, que pode estar desatualizada).
 * Admin e Dono (permissão "*") sempre passam.
 */
export async function userHasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return false;
  if (user.roles.length === 0) return false;

  // União de permissões de todos os cargos
  const allPerms = new Set<string>();
  for (const ur of user.roles) {
    const perms = parsePermissions(ur.role.permissions);
    perms.forEach((p) => allPerms.add(p));
  }

  if (allPerms.has("*")) return true;
  return allPerms.has(permission);
}

/**
 * Tipo auxiliar para respostas de erro de permissão.
 */
export function forbiddenResponse(message = "Sem permissão para esta ação") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
