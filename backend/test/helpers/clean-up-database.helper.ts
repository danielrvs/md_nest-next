import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";

export async function cleanupDatabase(prisma: PrismaService) {
    await Promise.all([
        prisma.taskAudit.deleteMany(),
        prisma.task.deleteMany(),
        prisma.user.deleteMany(),
        prisma.tenant.deleteMany(),
    ])
}