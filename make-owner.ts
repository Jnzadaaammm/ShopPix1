/**
 * Atribui o cargo "Dono" ao usuário cujo email está em OWNER_EMAIL.
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

  // Garantir que os cargos padrão existam (incluindo "Dono")
  console.log("📋 Criando/atualizando cargos padrão...");
  await ensureDefaultRoles();

  // Buscar o cargo Dono
  const donoRole = await prisma.role.findUnique({ where: { name: "Dono" } });
  if (!donoRole) {
    console.error("❌ Cargo 'Dono' não encontrado");
    process.exit(1);
  }

  // Buscar o usuário dono (pega o primeiro email se houver múltiplos)
  const email = ownerEmail.split(",")[0].trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ Usuário com email "${email}" não encontrado.`);
    console.error("   Faça login no site primeiro com esse email (Google/Discord) para criar a conta.");
    process.exit(1);
  }

  // Atribuir cargo Dono + marcar como admin
  console.log(`👑 Atribuindo cargo "Dono" a ${user.name || user.email}...`);
  await prisma.userRole.create({
    data: { userId: user.id, roleId: donoRole.id },
  }).catch(() => {}); // ignora se já existe
  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true },
  });
  console.log("✅ Cargo atribuído no site!");

  // Sincronizar cargos com Discord (cria o cargo "Dono" no servidor)
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

  // Sincronizar o cargo do dono no Discord (se tiver conta Discord)
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

  console.log("\n🎉 Pronto! Você agora é o Dono da loja.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
