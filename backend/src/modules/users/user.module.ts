import { Module } from "@nestjs/common";
import { UserRepositoryPort } from "./domain/ports/user.repository.port";
import { PrismaUserRepository } from "./infrastructure/adapters/prisma-user.repository";

@Module({
    providers: [
        {
            provide: UserRepositoryPort,
            useClass: PrismaUserRepository,
        }
    ],
    exports: [
        UserRepositoryPort,
    ]
})
export class UserModule { }