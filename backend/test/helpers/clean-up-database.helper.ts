import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";

export async function cleanupDatabase(prisma: PrismaService) {
    await prisma.appointment.deleteMany();
    await prisma.scheduleRules.deleteMany();
    await prisma.scheduleAbsences.deleteMany();
    await prisma.doctorsSpecialties.deleteMany();
    await prisma.doctorProfile.deleteMany();
    await prisma.specialty.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.mfaBackupCodes.deleteMany();
    await prisma.user.deleteMany();
}