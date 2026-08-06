/**
 * Atribui o cargo "Administrador" ao usuário cujo email está em OWNER_EMAIL.
 * Também marca como admin e sincroniza com o Discord.
 *
 * Uso: npm run make-owner
 */
import { prisma } from "@/lib/db";
import { ensureDefaultRoles } from "@/lib/roles";
import { setupDiscordRoles, syncDiscordRoles } from "@/lib/discord-guild";

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    console.error("❌ OWNER_EMAIL não configurado no .env");
    process.exit(1);
  }

  console.log("📋 Criando/atualizando cargos padrão...");
  await ensureDefaultRoles();

  const adminRole = await prisma.role.findUnique({ where: { name: "Administrador" } });
  if (!adminRole) {
    console.error("❌ Cargo 'Administrador' não encontrado");
    process.exit(1);
  }

  const email = ownerEmail.split(",")[0].trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ Usuário com email "${email}" não encontrado.`);
    console.error("   Faça login no site primeiro com esse email (Google/Discord) para criar a conta.");
    process.exit(1);
  }

  console.log(`👑 Atribuindo cargo "Administrador" a ${user.name || user.email}...`);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    create: { userId: user.id, roleId: adminRole.id },
    update: {},
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true },
  });
  console.log("✅ Cargo atribuído no site!");

  console.log("🔄 Sincronizando cargos com Discord...");
  const syncResult = await setupDiscordRoles();
  if (syncResult.ok) {
    const parts: string[] = [];
    if (syncResult.created?.length) parts.push(`${syncResult.created.length} criados`);
    if (syncResult.updated?.length) parts.push(`${syncResult.updated.length} atualizados`);
    console.log(`✅ Cargos sincronizados: ${parts.join(", ")}`);
  } else {
    console.warn("⚠️  Falha ao sincronizar cargos:", syncResult.error);
  }

  const discordAccount = await prisma.account.findFirst({
    where: { userId: user.id, provider: "discord" },
    select: { providerAccountId: true },
  });

  if (discordAccount?.providerAccountId) {
    console.log("🎮 Sincronizando seu cargo no Discord...");
    const roleSync = await syncDiscordRoles(user.id, discordAccount.providerAccountId);
    if (roleSync.ok) {
      console.log("✅ Cargo atribuído no Discord!");
    } else {
      console.warn("⚠️  Falha ao atribuir cargo no Discord:", roleSync.error);
    }
  } else {
    console.log("ℹ️  Sem conta Discord vinculada — sincronize fazendo login com Discord.");
  }

  console.log("\n🎉 Pronto! Você agora é o Administrador da loja.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
