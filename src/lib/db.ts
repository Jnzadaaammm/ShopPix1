import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Otimizações para reduzir consumo de memória
const prismaOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? ["query" as const, "error" as const, "warn" as const]
      : ["error" as const],
};

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
