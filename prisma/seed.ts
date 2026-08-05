import { prisma } from "@/lib/db";
import { ensureDefaultRoles, DEFAULT_ROLES } from "@/lib/roles";

const categories = [
  {
    name: "E-books",
    slug: "ebooks",
    description: "Livros digitais, apostilas e materiais de leitura",
  },
  {
    name: "Cursos",
    slug: "cursos",
    description: "Cursos em vídeo, mentorias e aulas online",
  },
  {
    name: "Software e Licenças",
    slug: "software",
    description: "Licenças de software, ativações e chaves de produto",
  },
  {
    name: "Templates e Assets",
    slug: "templates",
    description: "Templates, presets, plugins e recursos digitais",
  },
];

const products = [
  {
    name: "E-book: Guia Completo de Marketing Digital",
    description: "180 páginas com estratégias práticas de marketing digital, tráfego pago e copywriting.",
    price: 49.9,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    categorySlug: "ebooks",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: true,
  },
  {
    name: "Curso: Desenvolvimento Web Full Stack",
    description: "Curso completo com 120 horas de vídeo-aulas, projetos práticos e certificado.",
    price: 297.0,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop",
    categorySlug: "cursos",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: true,
  },
  {
    name: "Licença Windows 11 Pro (Ativação Vitalícia)",
    description: "Chave de ativação original do Windows 11 Pro. Entrega imediata após pagamento.",
    price: 89.9,
    image: "https://placehold.co/500x500/eef2ff/1e3a8a?text=Windows+11",
    categorySlug: "software",
    stock: 50,
    stockMode: "CREDENTIALS",
    featured: true,
  },
  {
    name: "Licença Office 365 Premium (1 ano)",
    description: "Assinatura de 12 meses do Microsoft 365 Family. Word, Excel, PowerPoint e 1TB OneDrive.",
    price: 129.9,
    image: "https://placehold.co/500x500/f0f9ff/0369a1?text=Office+365",
    categorySlug: "software",
    stock: 30,
    stockMode: "CREDENTIALS",
    featured: false,
  },
  {
    name: "Pack: 200 Templates para Notion",
    description: "Pacote com 200 templates profissionais para Notion: produtividade, finanças, CRM e mais.",
    price: 39.9,
    image: "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=500&h=500&fit=crop",
    categorySlug: "templates",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: true,
  },
  {
    name: "Presets Lightroom — Coleção Cinematic",
    description: "40 presets profissionais para Lightroom com look cinematográfico. Compatível mobile e desktop.",
    price: 59.9,
    image: "https://placehold.co/500x500/fff1f2/be123c?text=Lightroom",
    categorySlug: "templates",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: false,
  },
  {
    name: "E-book: Receitas Fit para o Dia a Dia",
    description: "100 receitas saudáveis, rápidas e baratas. Inclui lista de compras e tabela nutricional.",
    price: 29.9,
    image: "https://placehold.co/500x500/f0fdf4/15803d?text=Receitas+Fit",
    categorySlug: "ebooks",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: false,
  },
  {
    name: "Curso: Edição de Vídeo Profissional no Premiere",
    description: "Aprenda edição cinematográfica do zero ao avançado. 40 horas de conteúdo + projetos.",
    price: 197.0,
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&h=500&fit=crop",
    categorySlug: "cursos",
    stock: 0,
    stockMode: "SIMPLE",
    fileUrl: "",
    featured: false,
  },
];

async function main() {
  // === Cargos ===
  await ensureDefaultRoles();
  console.log(`✅ ${DEFAULT_ROLES.length} cargos criados/atualizados!`);

  // Atribuir cargo padrão (Bronze) a usuários sem nenhum cargo
  const bronzeRole = await prisma.role.findUnique({ where: { name: "Bronze" } });
  if (bronzeRole) {
    const usersWithoutRole = await prisma.user.findMany({
      where: { roles: { none: {} } },
    });
    if (usersWithoutRole.length > 0) {
      await prisma.userRole.createMany({
        data: usersWithoutRole.map((u) => ({ userId: u.id, roleId: bronzeRole.id })),
      });
      console.log(`✅ ${usersWithoutRole.length} usuários receberam o cargo Bronze`);
    }
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({ data: categories });
    console.log(`✅ ${categories.length} categorias criadas com sucesso!`);
  } else {
    console.log(`ℹ️  Banco já possui ${categoryCount} categorias. Seed de categorias ignorado.`);
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    // Get categories to map products
    const categoryMap = await prisma.category.findMany();
    const categorySlugToId = Object.fromEntries(
      categoryMap.map(cat => [cat.slug, cat.id])
    );

    const productsWithCategoryId = products.map(product => {
      const { categorySlug, ...productData } = product;
      return {
        ...productData,
        categoryId: categorySlugToId[categorySlug],
      };
    });

    await prisma.product.createMany({ data: productsWithCategoryId });
    console.log(`✅ ${productsWithCategoryId.length} produtos criados com sucesso!`);
  } else {
    console.log(`ℹ️  Banco já possui ${productCount} produtos. Seed de produtos ignorado.`);
  }

  // Create admin user if not exists
  const adminEmail = "cadeapicanhalulala@gmail.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const donoRole = await prisma.role.findUnique({ where: { name: "Dono" } });
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        isAdmin: true,
      },
    });
    if (donoRole) {
      await prisma.userRole.create({
        data: { userId: adminUser.id, roleId: donoRole.id },
      }).catch(() => {});
    }
    console.log(`✅ Usuário admin criado: ${adminEmail}`);
  } else if (!existingAdmin.isAdmin) {
    const donoRole = await prisma.role.findUnique({ where: { name: "Dono" } });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });
    if (donoRole) {
      await prisma.userRole.create({
        data: { userId: existingAdmin.id, roleId: donoRole.id },
      }).catch(() => {});
    }
    console.log(`✅ Usuário ${adminEmail} atualizado para admin`);
  } else {
    console.log(`ℹ️  Usuário admin já existe: ${adminEmail}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
