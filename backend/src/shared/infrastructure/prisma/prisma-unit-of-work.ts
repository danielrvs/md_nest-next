import { UnitOfWork } from "@/shared/domain/interfaces/unit-of-work.interface";
import { Injectable } from "@nestjs/common";
import { Prisma } from "generated/prisma/client";
import { PrismaService } from "./prisma.service";
import { ProjectRepositoryPort } from "@/modules/projects/domain/ports/project.repository.port";
import { PrismaProjectRepository } from "@/modules/projects/infrastructure/adapters/prisma-project.repository";
import { LicenseAssignmentRepositoryPort } from "@/modules/licenses/domain/ports/license-assignment.repository.port";
import { PrismaLicenseAssignmentRepository } from "@/modules/licenses/infrastructure/adapters/prisma-license-assignment.repository";
@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
    private txClient: Prisma.TransactionClient | null = null;

    constructor(private readonly prisma: PrismaService) { super(); }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (tx) => {
            this.txClient = tx; // Guardamos el contexto temporalmente
            const result = await operation();
            this.txClient = null; // Limpiamos al terminar
            return result;
        });
    }

    // Los repositorios se instancian inyectando el txClient si existe, o el prisma normal si no
    getProjectRepository(): ProjectRepositoryPort {
        return new PrismaProjectRepository(this.txClient || this.prisma);
    }

    getLicenseRepository(): LicenseAssignmentRepositoryPort {
        return new PrismaLicenseAssignmentRepository(this.txClient || this.prisma);
    }
}