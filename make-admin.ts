import { prisma } from "./src/lib/db";

async function makeAdmin() {
  try {
    // Buscar o primeiro usuário
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log("❌ Nenhum usuário encontrado. Faça login primeiro!");
      process.exit(1);
    }
    
    // Atualizar para admin
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });
    
    console.log(`✅ Usuário ${user.name || user.email} agora é admin!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nome: ${user.name}`);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();