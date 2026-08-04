import { prisma } from "@/lib/db";

async function makeAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`❌ Usuário não encontrado: ${email}`);
    console.log(`ℹ️  Faça login primeiro via OAuth e depois execute este script novamente.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`✅ Usuário ${email} agora é admin!`);
  console.log(`   Nome: ${updated.name}`);
  console.log(`   Email: ${updated.email}`);
}

const email = process.argv[2];
if (!email) {
  console.log("Uso: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

makeAdmin(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());