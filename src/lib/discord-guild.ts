/**
 * Integração com Discord: adicionar usuário ao servidor da loja,
 * sincronizar cargos do site com cargos do Discord e enviar webhook de
 * notificação quando alguém entra com Discord.
 *
 * Pré-requisitos:
 *  - Bot criado em https://discord.com/developers/applications
 *  - Bot adicionado ao servidor com permissão "Gerenciar Servidor" + "Gerenciar Cargos"
 *    (ou cargo acima dos membros) para poder adicionar pessoas e atribuir cargos
 *  - OAuth do app com scope "guilds.join" (configurado no provider Discord)
 *  - Webhook criado no canal de notificações do servidor
 *  - Cargos no Discord são criados automaticamente pelo bot (não precisa manual)
 */

import { prisma } from "./db";

const DISCORD_API = "https://discord.com/api/v10";

// Mapeia cores do site para cores RGB do Discord
const COLOR_MAP: Record<string, number> = {
  gray: 0x808080,
  blue: 0x3498db,
  green: 0x2ecc71,
  purple: 0x9b59b6,
  gold: 0xf1c40f,
  orange: 0xe67e22,
  red: 0xe74c3c,
};

// Permissões do Discord (bitflags)
// https://discord.com/developers/docs/topics/permissions
const PERM = {
  KICK_MEMBERS: 1 << 1,           // 2
  BAN_MEMBERS: 1 << 2,            // 4
  ADMINISTRATOR: 1 << 3,          // 8
  MANAGE_CHANNELS: 1 << 4,        // 16
  MANAGE_GUILD: 1 << 5,           // 32
  VIEW_AUDIT_LOG: 1 << 7,         // 128
  MANAGE_MESSAGES: 1 << 13,       // 8192
  MODERATE_MEMBERS: 1 << 24,      // 16777216 (timeout / silenciar)
  MANAGE_NICKNAMES: 1 << 27,      // 134217728
  MANAGE_ROLES: 1 << 28,          // 268435456
} as const;

/**
 * Calcula as permissões do Discord para um cargo do site,
 * baseado no tipo (CLIENT/TEAM) e nível hierárquico.
 *
 * CLIENT: sem permissões especiais (membro comum)
 * TEAM: permissões crescentes conforme o nível:
 *   - Suporte (10+): ver logs, gerenciar mensagens, timeout, apelidos
 *   - Moderador (20+): + expulsar, banir
 *   - Dono (999): ADMINISTRATOR (tudo)
 */
function computeDiscordPermissions(role: { type: string; level: number }): string {
  if (role.type !== "TEAM") return "0";

  // Admin tem todas as permissões
  if (role.level >= 100) return String(PERM.ADMINISTRATOR);

  // Acumular permissões conforme o nível
  let perms = 0;

  // Suporte+ (level 10): moderação básica
  if (role.level >= 10) {
    perms |= PERM.VIEW_AUDIT_LOG;
    perms |= PERM.MANAGE_MESSAGES;
    perms |= PERM.MODERATE_MEMBERS;
    perms |= PERM.MANAGE_NICKNAMES;
  }

  // Moderador+ (level 20): + kick/ban
  if (role.level >= 20) {
    perms |= PERM.KICK_MEMBERS;
    perms |= PERM.BAN_MEMBERS;
  }

  // Dono (level 999): + gerenciar servidor, canais e cargos
  if (role.level >= 999) {
    perms |= PERM.MANAGE_GUILD;
    perms |= PERM.MANAGE_CHANNELS;
    perms |= PERM.MANAGE_ROLES;
  }

  return String(perms);
}

/**
 * Adiciona (ou re-adiciona) um usuário ao servidor da loja usando o
 * access_token OAuth dele. Requer o token do bot + o token do usuário
 * (com scope guilds.join).
 *
 * Idempotente: se o usuário já estiver no servidor, retorna 204 e nada
 * acontece. Se o bot tiver cargo alto o suficiente, pode "puxar" membros
 * que saíram por conta própria.
 */
export async function addUserToGuild(
  discordUserId: string,
  userAccessToken: string
): Promise<{ ok: boolean; alreadyMember: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return { ok: false, alreadyMember: false, error: "DISCORD_BOT_TOKEN ou DISCORD_GUILD_ID não configurados" };
  }

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: userAccessToken,
    }),
  });

  // 201 = adicionado agora, 204 = já era membro
  if (res.status === 201) return { ok: true, alreadyMember: false };
  if (res.status === 204) return { ok: true, alreadyMember: true };

  const text = await res.text().catch(() => "");
  return {
    ok: false,
    alreadyMember: false,
    error: `Discord API ${res.status}: ${text || res.statusText}`,
  };
}

interface WebhookUser {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Envia uma mensagem de webhook no canal de notificações do Discord
 * anunciando que um novo usuário entrou na loja via Discord.
 */
export async function sendLoginWebhook(user: WebhookUser): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[discord] DISCORD_WEBHOOK_URL não configurado — webhook pulado");
    return;
  }
  const username = user.name || "Usuário sem nome";
  const email = user.email || "sem email";
  const avatar = user.image || undefined;

  const embed: {
    title: string;
    description: string;
    color: number;
    fields: { name: string; value: string; inline: boolean }[];
    timestamp: string;
    footer: { text: string };
    thumbnail?: { url: string };
  } = {
    title: "Novo usuário na loja!",
    description: `**${username}** acabou de entrar usando Discord.`,
    color: 0x5865f2, // blurple
    fields: [{ name: "Email", value: email, inline: true }],
    timestamp: new Date().toISOString(),
    footer: { text: "Sistema de Login • E-commerce" },
  };

  if (avatar) {
    embed.thumbnail = { url: avatar };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    // console.log("[discord] Webhook enviado, status:", res.status);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[discord] Webhook falhou:", res.status, text);
    }
  } catch (error) {
    console.error("Erro ao enviar webhook Discord:", error);
  }
}

/**
 * Sincroniza os cargos do usuário no Discord com os cargos que ele tem no site.
 *
 * Como um usuário pode ter vários cargos no site (N:N via UserRole), esta
 * função escolhe o cargo de maior nível (com `discordRoleId` configurado)
 * como o cargo "principal" a ser refletido no Discord.
 *
 * - Busca todos os cargos do site que têm `discordRoleId` configurado
 * - Remove do usuário no Discord todos os cargos mapeados (exceto o atual)
 * - Adiciona apenas o cargo do Discord correspondente ao cargo de maior nível
 *
 * Requer que o bot tenha permissão "Gerenciar Cargos" e que o cargo do bot
 * esteja acima dos cargos que ele vai atribuir.
 *
 * @param userId ID do usuário no banco do site
 * @param discordUserId ID do usuário no Discord (providerAccountId)
 */
export async function syncDiscordRoles(
  userId: string,
  discordUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return { ok: false, error: "DISCORD_BOT_TOKEN ou DISCORD_GUILD_ID não configurados" };
  }

  // Buscar o usuário com seus cargos atuais (N:N via UserRole)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
    },
  });
  if (!user || user.roles.length === 0) {
    return { ok: false, error: "Usuário sem cargo no site" };
  }

  // Buscar todos os cargos do site que têm discordRoleId configurado
  const allRoles = await prisma.role.findMany({
    where: { discordRoleId: { not: null } },
    select: { id: true, discordRoleId: true },
  });
  if (allRoles.length === 0) {
    return { ok: false, error: "Nenhum cargo tem discordRoleId configurado" };
  }

  // Entre os cargos do usuário, encontrar o de maior nível que tenha
  // discordRoleId configurado (maior level = cargo mais alto na hierarquia).
  // Se o usuário tiver vários cargos TEAM, usa o de maior nível.
  const userRolesWithDiscord = user.roles
    .map((ur) => ur.role)
    .filter((r) => r.discordRoleId !== null)
    .sort((a, b) => b.level - a.level);

  if (userRolesWithDiscord.length === 0) {
    return { ok: false, error: "Nenhum cargo do usuário tem discordRoleId configurado" };
  }

  // Cargo alvo no Discord = cargo de maior nível com mapeamento
  const targetDiscordRoleId = userRolesWithDiscord[0].discordRoleId;

  // Buscar cargos atuais do membro no Discord
  const memberRes = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`,
    {
      headers: { Authorization: `Bot ${botToken}` },
    }
  );

  if (!memberRes.ok) {
    const text = await memberRes.text().catch(() => "");
    return { ok: false, error: `Falha ao buscar membro: ${memberRes.status} ${text}` };
  }

  const member = (await memberRes.json()) as { roles?: string[] };
  const currentDiscordRoles = new Set(member.roles || []);

  // Todos os discordRoleIds mapeados (para saber quais remover)
  const mappedDiscordRoleIds = new Set(
    allRoles
      .map((r) => r.discordRoleId)
      .filter((id): id is string => id !== null)
  );

  // Remover cargos mapeados que não são o alvo
  const rolesToRemove = Array.from(currentDiscordRoles).filter(
    (id) => mappedDiscordRoleIds.has(id) && id !== targetDiscordRoleId
  );

  // Adicionar cargo alvo se ainda não tiver
  const rolesToAdd =
    targetDiscordRoleId && !currentDiscordRoles.has(targetDiscordRoleId)
      ? [targetDiscordRoleId]
      : [];

  if (rolesToRemove.length === 0 && rolesToAdd.length === 0) {
    return { ok: true };
  }

  // Aplicar remoções
  for (const roleId of rolesToRemove) {
    await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bot ${botToken}` },
    });
  }

  // Aplicar adições
  for (const roleId of rolesToAdd) {
    await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: "PUT",
      headers: { Authorization: `Bot ${botToken}` },
    });
  }

  return { ok: true };
}

/**
 * Cria (ou recria) todos os cargos do site no servidor do Discord e
 * atualiza o campo `discordRoleId` em cada cargo do banco.
 *
 * Para cada cargo do site:
 *  - Se já existir um cargo no Discord com o mesmo nome (e já mapeado),
 *    reutiliza e apenas atualiza a cor/permissões
 *  - Se não existir, cria um novo cargo no Discord com a cor correspondente
 *
 * Permissões do Discord são calculadas automaticamente conforme o tipo e
 * nível do cargo (ver computeDiscordPermissions). A posição hierárquica
 * dos cargos no Discord é reordenada para bater com a do site.
 *
 * @returns relatório com os cargos criados/atualizados
 */
export async function setupDiscordRoles(): Promise<{
  ok: boolean;
  error?: string;
  created?: string[];
  updated?: string[];
  skipped?: string[];
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return { ok: false, error: "DISCORD_BOT_TOKEN ou DISCORD_GUILD_ID não configurados" };
  }

  // Buscar todos os cargos do site, ordenados por hierarquia
  // (CLIENT primeiro por level, depois TEAM por level)
  const siteRoles = await prisma.role.findMany({
    orderBy: [{ type: "asc" }, { level: "asc" }],
  });

  if (siteRoles.length === 0) {
    return { ok: false, error: "Nenhum cargo encontrado no site" };
  }

  // Buscar cargos existentes no Discord
  const guildRolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!guildRolesRes.ok) {
    const text = await guildRolesRes.text().catch(() => "");
    return { ok: false, error: `Falha ao buscar cargos do Discord: ${guildRolesRes.status} ${text}` };
  }

  const guildRoles = (await guildRolesRes.json()) as Array<{
    id: string;
    name: string;
    color: number;
    position: number;
    permissions: string;
  }>;

  // Encontrar a posição máxima que o bot pode gerenciar (posição do
  // cargo mais alto do bot - 1), para saber até onde reordenar
  let maxPosition = 100; // fallback
  const botUserRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (botUserRes.ok) {
    const botUser = (await botUserRes.json()) as { id: string };
    const botMemberRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${botUser.id}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    if (botMemberRes.ok) {
      const member = (await botMemberRes.json()) as { roles: string[] };
      const botRolePositions = member.roles
        .map((rid) => guildRoles.find((r) => r.id === rid)?.position)
        .filter((p): p is number => p !== undefined);
      if (botRolePositions.length > 0) {
        maxPosition = Math.max(...botRolePositions);
      }
    }
  }

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  // Mapear cargo do site → ID do Discord (para reordenação depois)
  const siteToDiscordId: { siteRoleId: string; discordRoleId: string; name: string }[] = [];

  for (const role of siteRoles) {
    const color = COLOR_MAP[role.color] ?? 0x808080;
    const permissions = computeDiscordPermissions({ type: role.type, level: role.level });

    // Procurar cargo existente no Discord pelo ID mapeado ou pelo nome
    let existingDiscordRole = guildRoles.find((r) => r.id === role.discordRoleId);
    if (!existingDiscordRole) {
      existingDiscordRole = guildRoles.find(
        (r) => r.name.toLowerCase() === role.name.toLowerCase()
      );
    }

    if (existingDiscordRole) {
      // Atualizar cor, permissões e nome do cargo existente
      const updateRes = await fetch(
        `${DISCORD_API}/guilds/${guildId}/roles/${existingDiscordRole.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: role.name,
            color,
            permissions,
            mentionable: true,
          }),
        }
      );

      if (updateRes.ok) {
        await prisma.role.update({
          where: { id: role.id },
          data: { discordRoleId: existingDiscordRole.id },
        });
        siteToDiscordId.push({ siteRoleId: role.id, discordRoleId: existingDiscordRole.id, name: role.name });
        updated.push(`${role.name} → ${existingDiscordRole.id}`);
      } else {
        const text = await updateRes.text().catch(() => "");
        skipped.push(`${role.name} (erro ao atualizar: ${updateRes.status} ${text})`);
      }
    } else {
      // Criar novo cargo no Discord
      const createRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: role.name,
          color,
          permissions,
          mentionable: true,
        }),
      });

      if (createRes.ok) {
        const newRole = (await createRes.json()) as { id: string };
        await prisma.role.update({
          where: { id: role.id },
          data: { discordRoleId: newRole.id },
        });
        siteToDiscordId.push({ siteRoleId: role.id, discordRoleId: newRole.id, name: role.name });
        created.push(`${role.name} → ${newRole.id}`);
      } else {
        const text = await createRes.text().catch(() => "");
        skipped.push(`${role.name} (erro ao criar: ${createRes.status} ${text})`);
      }
    }
  }

  // === Reordenar cargos por hierarquia ===
  // siteRoles já está ordenado por (type asc, level asc), que é a ordem
  // hierárquica do site: Bronze < Prata < Ouro < Diamante < Suporte < Moderador < Dono
  // No Discord, posição maior = mais alto na hierarquia.
  // Vamos atribuir posições de 1 até N (abaixo do cargo do bot).
  if (siteToDiscordId.length > 1) {
    // Posição máxima que o bot pode gerenciar = posição do cargo do bot - 1
    const topPosition = Math.min(maxPosition - 1, siteToDiscordId.length + 1);
    const startPos = Math.max(1, topPosition - siteToDiscordId.length + 1);

    const positions = siteToDiscordId.map((r, index) => ({
      id: r.discordRoleId,
      position: startPos + index,
    }));

    const reorderRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(positions),
    });

    if (!reorderRes.ok) {
      const text = await reorderRes.text().catch(() => "");
      skipped.push(`Reordenação falhou: ${reorderRes.status} ${text}`);
    }
  }

  return { ok: true, created, updated, skipped };
}
