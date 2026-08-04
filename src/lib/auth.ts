import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { prisma } from "./db";
import { addUserToGuild, sendLoginWebhook, syncDiscordRoles } from "./discord-guild";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // guilds.join permite adicionar o usuário ao servidor da loja
          // via API usando o access_token dele.
          scope: "identify email guilds.join",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      // Atribuir cargo padrão (Bronze) a novos usuários
      if (!user.id) return;
      const defaultRole = await prisma.role.findFirst({
        where: { isDefault: true },
      });
      if (defaultRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: defaultRole.id },
        }).catch(() => {}); // ignora se já existe
      }
    },

    // Dispara quando uma conta Discord é vinculada (primeiro login).
    // Aproveitamos para enviar webhook e adicionar ao servidor.
    async linkAccount({ user, account }) {
      console.log("[auth] linkAccount disparado:", { provider: account?.provider, hasToken: !!account?.access_token, providerAccountId: account?.providerAccountId });
      if (account.provider !== "discord") return;

      // Webhook de boas-vindas (só na primeira vez)
      await sendLoginWebhook(user);

      // Adicionar ao servidor da loja
      if (account.access_token && account.providerAccountId) {
        const result = await addUserToGuild(
          account.providerAccountId,
          account.access_token
        );
        console.log("[auth] addUserToGuild (linkAccount):", result);
        if (!result.ok && !result.alreadyMember) {
          console.error("Falha ao adicionar usuário ao servidor Discord:", result.error);
        }
      }
    },

    // Dispara em todo login. Para Discord, tentamos (re)adicionar ao
    // servidor — se a pessoa saiu, o bot a puxa de volta.
    async signIn({ user, account }) {
      console.log("[auth] signIn event disparado:", { provider: account?.provider, hasToken: !!account?.access_token, providerAccountId: account?.providerAccountId });
      if (account?.provider !== "discord") return;
      if (!account.access_token || !account.providerAccountId) {
        console.warn("[auth] signIn Discord sem access_token ou providerAccountId");
        return;
      }

      const result = await addUserToGuild(
        account.providerAccountId,
        account.access_token
      );
      console.log("[auth] addUserToGuild (signIn):", result);
      if (!result.ok && !result.alreadyMember) {
        console.error("Falha ao (re)adicionar usuário ao servidor Discord:", result.error);
      }

      // Sincronizar cargos do Discord com o cargo do site
      if (user.id && account.providerAccountId) {
        const syncResult = await syncDiscordRoles(user.id, account.providerAccountId);
        if (!syncResult.ok) {
          console.warn("[auth] syncDiscordRoles:", syncResult.error);
        }
      }

      // Webhook de notificação em todo login Discord
      await sendLoginWebhook(user);
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // @ts-expect-error - isAdmin não está no tipo DefaultUser
        session.user.isAdmin = user.isAdmin;

        // Buscar todos os cargos do usuário
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: { include: { role: true } },
          },
        });

        if (dbUser?.roles && dbUser.roles.length > 0) {
          const roles = dbUser.roles.map((ur) => ur.role);

          // União de todas as permissões
          const allPermissions = new Set<string>();
          for (const r of roles) {
            try {
              const perms = JSON.parse(r.permissions);
              if (Array.isArray(perms)) perms.forEach((p: string) => allPermissions.add(p));
            } catch {}
          }

          // Cargo "principal" = maior nível (para display)
          const topRole = roles.reduce((top, r) =>
            r.level > top.level ? r : top
          );

          // Maior desconto entre todos os cargos
          const maxDiscount = Math.max(...roles.map((r) => r.discount));

          // @ts-expect-error - role não está no tipo DefaultUser
          session.user.role = {
            id: topRole.id,
            name: topRole.name,
            type: topRole.type,
            level: topRole.level,
            discount: maxDiscount,
            color: topRole.color,
            permissions: Array.from(allPermissions),
          };

          // @ts-expect-error - roles não está no tipo DefaultUser
          session.user.roles = roles.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            level: r.level,
            discount: r.discount,
            color: r.color,
          }));
        }
      }
      return session;
    },
  },
});
