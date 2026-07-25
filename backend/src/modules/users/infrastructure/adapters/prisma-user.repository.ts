import { PrismaBaseRepository } from "@/shared/infrastructure/adapters/prisma-base.repository";
import { Injectable } from "@nestjs/common";
import { UserRepositoryPort } from "../../domain/ports/user.repository.port";
import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";
import { User } from "../../domain/entities/user.entity";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class PrismaUserRepository extends PrismaBaseRepository implements UserRepositoryPort {

    constructor(
        private readonly prisma: PrismaService
    ) {
        super();
    }

    async create(entity: User): Promise<User> {
        return await this.handleDbOperation(async () => {
            const savedUser = await this.prisma.user.create({
                data: UserMapper.toCreateInput(entity)
            });
            return UserMapper.toDomain(savedUser);
        })
    }
    async createMany(entities: User[]): Promise<{ count: number }> {
        return await this.handleDbOperation(async () => {
            const users = await this.prisma.user.createMany({
                data: entities.map(UserMapper.toCreateManyInput)
            });
            return { count: users.count as number };
        })
    }
    async findByEmail(email: string): Promise<User | null> {
        return this.handleDbOperation(async () => {
            const user = await this.prisma.user.findUnique({
                where: {
                    email
                }
            });
            return user ? UserMapper.toDomain(user) : null;
        })
    }


    async findById(id: string): Promise<User | null> {
        return this.handleDbOperation(async () => {
            const user = await this.prisma.user.findUnique({
                where: {
                    id
                }
            });
            return user ? UserMapper.toDomain(user) : null;
        })
    }


    async update(id: string, data: User): Promise<User> {
        return await this.handleDbOperation(async () => {
            const updatedUser = await this.prisma.user.update({
                where: {
                    id
                },
                data: UserMapper.toUpdateInput(data)
            })
            return UserMapper.toDomain(updatedUser);
        })
    }
    async delete(id: string): Promise<void> {
        return await this.handleDbOperation(async () => {
            await this.prisma.user.delete({
                where: {
                    id
                }
            });
        })
    }

}