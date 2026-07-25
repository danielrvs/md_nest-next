import { UserRole } from "@/modules/users/domain/entities/enums/user-role.enum";
import { BaseFactory } from "../base.factory";
import { UserRole as PrismaUserRole } from "generated/prisma/enums";
import { User } from "@/modules/users/domain/entities/user.entity";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { randomUUID } from "crypto";
import { faker } from "@faker-js/faker";
import { Email } from "@/modules/users/domain/entities/vo/email.vo";
import { PasswordHash } from "@/modules/users/domain/entities/vo/password-hash.vo";
import { TokenGeneratorPort, TokenPayload } from "@/modules/auth/domain/ports/token-generator.port";

export type UserStateOverride = {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    passwordResetToken?: string | null;
    passwordResetExpiresAt?: Date | null;
    role?: UserRole;
    mfaSecret?: string | null;
    mfaFactorConfirmedAt?: Date | null;
    phoneNumber?: string | null;
    emailVerified?: Date | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export type PrismaUserData = {
    id: string;
    name: string;
    email: string;
    password: string | null;
    passwordResetToken: string | null;
    passwordResetExpiresAt: Date | null;
    role: PrismaUserRole;
    mfaSecret: string | null;
    mfaFactorConfirmedAt: Date | null;
    phoneNumber: string | null;
    emailVerified: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export class UserFactoryBuilder extends BaseFactory<UserStateOverride, User> {
    constructor(
        protected readonly repository: UserRepositoryPort,
        protected readonly tokenGenerator: TokenGeneratorPort,
    ) {
        super(repository);
    }

    protected async defaultDefinition(): Promise<Required<UserStateOverride>> {
        return {
            id: randomUUID(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            passwordResetToken: null,
            passwordResetExpiresAt: null,
            role: faker.helpers.arrayElement([UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT]),
            mfaSecret: null,
            mfaFactorConfirmedAt: null,
            phoneNumber: null,
            emailVerified: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    protected async createEntity(): Promise<User> {
        const def = { ...(await this.defaultDefinition()), ...this.overrides };
        const password = def.password ? await PasswordHash.create(def.password) : null;
        const passwordResetToken = def.passwordResetToken
            ? await PasswordHash.create(def.passwordResetToken)
            : null;

        return new User(
            def.id,
            Email.create(def.email),
            def.name,
            def.role,
            password,
            passwordResetToken,
            def.passwordResetExpiresAt,
            def.mfaSecret,
            def.mfaFactorConfirmedAt,
            def.phoneNumber,
            def.emailVerified,
            def.isActive,
            def.createdAt,
            def.updatedAt,
        );
    }

    public asDoctor(): UserFactoryBuilder {
        return this.state({ role: UserRole.DOCTOR });
    }

    public asPatient(): UserFactoryBuilder {
        return this.state({ role: UserRole.PATIENT });
    }

    public asAdmin(): UserFactoryBuilder {
        return this.state({ role: UserRole.ADMIN });
    }

    public with2FA(): UserFactoryBuilder {
        return this.state({
            mfaSecret: faker.string.alphanumeric(32),
            mfaFactorConfirmedAt: new Date(),
        });
    }

    public withPasswordResetToken(
        token: string | null = null,
        expiresAt: Date | null = null,
    ): UserFactoryBuilder {
        return this.state({
            passwordResetToken: token ?? faker.string.alphanumeric(8),
            passwordResetExpiresAt: expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
        });
    }

    public async createMfaUnverifiedUser(): Promise<{ user: User; token: string }> {
        const user = await this.create();
        const token = await this.tokenGenerator.generateMfaToken(user);
        return { user, token };
    }

    public async createAuthenticatedUser(): Promise<{ user: User; auth: TokenPayload }> {
        const user = await this.create();
        const auth = await this.tokenGenerator.generateToken(user);
        return { user, auth };
    }
}