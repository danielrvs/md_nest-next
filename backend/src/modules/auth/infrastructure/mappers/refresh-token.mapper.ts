import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { Prisma, RefreshToken as PrismaRefreshToken } from "generated/prisma/client";

export class RefreshTokenMapper {
    static toDomain(model: PrismaRefreshToken): RefreshToken {
        return new RefreshToken(
            model.id,
            model.userId,
            model.token,
            model.expiresAt,
            model.createdAt,
            model.updatedAt
        )
    }

    static toCreateInput(entity: RefreshToken): Prisma.RefreshTokenCreateInput {
        return {
            id: entity.id,
            user: {
                connect: {
                    id: entity.userId
                }
            },
            token: entity.token,
            expiresAt: entity.expiresAt,
        }
    }

    static toUpdateInput(entity: RefreshToken): Prisma.RefreshTokenUpdateInput {
        return {
            token: entity.token,
            expiresAt: entity.expiresAt,
        }
    }
}