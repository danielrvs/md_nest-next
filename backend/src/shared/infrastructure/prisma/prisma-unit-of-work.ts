import { UnitOfWorkInterface } from "@/shared/application/interfaces/unit-of-work.interface";
import { RepositoryFactoryInterface } from "@/shared/application/interfaces/repository-factory.interface";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PrismaUserRepository } from "@/modules/users/infrastructure/adapters/prisma-user.repository";

@Injectable()
export class PrismaUnitOfWork implements UnitOfWorkInterface {
    constructor(private readonly prisma: PrismaService) {}

    async execute<T>(operation: (repositoryFactory: RepositoryFactoryInterface) => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (tx) => {
            const repositoryFactory: RepositoryFactoryInterface = {
                createUserRepository: () => new PrismaUserRepository(tx as unknown as PrismaService),
            };
            return await operation(repositoryFactory);
        });
    }
}