import { prisma } from "./src/lib/db";

const email = process.argv[2] || process.env.OWNER_EMAIL;

if (!email) {
  console.error("Uso: npx tsx make-owner.ts email@exemplo.com");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    console.error("Usuário não encontrado:", email);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true },
  });

  console.log(`${email} agora é dono/admin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
