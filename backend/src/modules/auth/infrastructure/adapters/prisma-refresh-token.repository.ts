import { PrismaBaseRepository } from "@/shared/infrastructure/adapters/prisma-base.repository";
import { RefreshTokenRepositoryPort } from "../../domain/ports/refresh-token.repository.port";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { RefreshTokenMapper } from "../mappers/refresh-token.mapper";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";

@Injectable()
export class PrismaRefreshTokenRepository extends PrismaBaseRepository implements RefreshTokenRepositoryPort {
    constructor(
        private readonly prisma: PrismaService
    ) {
        super()
    }

    async create(entity: RefreshToken): Promise<RefreshToken> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.refreshToken.create({
                data: RefreshTokenMapper.toCreateInput(entity)
            })
            return RefreshTokenMapper.toDomain(result);
        })
    }
    async findByTokenAndUserId(token: string, userId: string): Promise<RefreshToken | null> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.refreshToken.findUnique({
                where: {
                    token_userId: {
                        token,
                        userId
                    }
                }
            })
            return result ? RefreshTokenMapper.toDomain(result) : null;
        })
    }

    async delete(token: string, userId: string): Promise<void> {
        await this.handleDbOperation(async () => {
            await this.prisma.refreshToken.delete({
                where: {
                    token_userId: {
                        token,
                        userId
                    }
                }
            })
        })
    }
    async deleteAllByUserId(userId: string): Promise<void> {
        await this.handleDbOperation(async () => {
            await this.prisma.refreshToken.deleteMany({
                where: {
                    userId: userId
                }
            })
        })
    }

}