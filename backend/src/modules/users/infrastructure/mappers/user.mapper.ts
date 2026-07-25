import { User } from "../../domain/entities/user.entity";
import {
    User as PrismaUser,
    Prisma,
    UserRole as PrismaUserRole,
    RefreshToken as PrismaRefreshToken,
    MfaBackupCodes as PrismaMfaBackupCodes,
} from "generated/prisma/client";
import { Email } from "../../domain/entities/vo/email.vo";
import { PasswordHash } from "../../domain/entities/vo/password-hash.vo";
import { UserRole } from "../../domain/entities/enums/user-role.enum";
import { UserResDto } from "../../application/dtos/user.res.dto";
import { RefreshTokenMapper } from "@/modules/auth/infrastructure/mappers/refresh-token.mapper";
import { MfaBackupCodesMapper } from "@/modules/auth/infrastructure/mappers/mfa-backup-codes.mapper";

type UserWithRelations = PrismaUser & {
    refreshTokens?: PrismaRefreshToken[];
    mfaBackupCodes?: PrismaMfaBackupCodes[];
};

export class UserMapper {
    static toDomain(prismaUser: UserWithRelations): User {
        return new User(
            prismaUser.id,
            Email.create(prismaUser.email),
            prismaUser.name,
            prismaUser.role as UserRole,
            prismaUser.password ? PasswordHash.fromHash(prismaUser.password) : null,
            prismaUser.passwordResetToken ? PasswordHash.fromHash(prismaUser.passwordResetToken) : null,
            prismaUser.passwordResetExpiresAt,
            prismaUser.mfaSecret,
            prismaUser.mfaFactorConfirmedAt,
            prismaUser.phoneNumber,
            prismaUser.emailVerified,
            prismaUser.isActive,
            prismaUser.createdAt,
            prismaUser.updatedAt,
            prismaUser.mfaBackupCodes
                ? prismaUser.mfaBackupCodes.map((code) => MfaBackupCodesMapper.toDomain(code))
                : null,
            prismaUser.refreshTokens
                ? prismaUser.refreshTokens.map((token) => RefreshTokenMapper.toDomain(token))
                : null,
        );
    }

    static toCreateInput(user: User): Prisma.UserCreateInput {
        return {
            id: user.id ?? undefined,
            name: user.name,
            email: user.email.toString(),
            password: user.password?.toString() ?? null,
            passwordResetToken: user.passwordResetToken?.toString() ?? null,
            passwordResetExpiresAt: user.passwordResetExpiresAt,
            mfaSecret: user.mfaSecret,
            mfaFactorConfirmedAt: user.mfaFactorConfirmedAt,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            role: user.role as PrismaUserRole,
        };
    }

    static toCreateManyInput(user: User): Prisma.UserCreateManyInput {
        return {
            id: user.id ?? undefined,
            name: user.name,
            email: user.email.toString(),
            password: user.password?.toString() ?? null,
            passwordResetToken: user.passwordResetToken?.toString() ?? null,
            passwordResetExpiresAt: user.passwordResetExpiresAt,
            mfaSecret: user.mfaSecret,
            mfaFactorConfirmedAt: user.mfaFactorConfirmedAt,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            role: user.role as PrismaUserRole,
        };
    }

    static toUpdateInput(user: User): Prisma.UserUpdateInput {
        return {
            name: user.name,
            email: user.email.toString(),
            password: user.password?.toString() ?? null,
            passwordResetToken: user.passwordResetToken?.toString() ?? null,
            passwordResetExpiresAt: user.passwordResetExpiresAt,
            mfaSecret: user.mfaSecret,
            mfaFactorConfirmedAt: user.mfaFactorConfirmedAt,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            role: user.role as PrismaUserRole,
        };
    }

    static toResponse(user: User): UserResDto {
        return {
            id: user.id,
            name: user.name,
            email: user.email.toString(),
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
}