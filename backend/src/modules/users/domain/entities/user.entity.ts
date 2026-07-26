import { randomUUID } from "crypto";
import { UserRole } from "./enums/user-role.enum";
import { Email } from "./vo/email.vo";
import { PasswordHash } from "./vo/password-hash.vo";
import { MfaBackupCodes } from "@/modules/auth/domain/entities/mfa-backup-codes.entity";
import { RefreshToken } from "@/modules/auth/domain/entities/refresh-token.entity";

// Forward-declared relation types (loaded lazily)
export type UserDoctorProfile = {
    id: string;
    licenseNumber: string;
    bio: string | null;
    consultationFee: number | null;
    isVerified: boolean;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type UserAppointment = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startTime: Date;
    endTime: Date;
    patientId: string;
    doctorId: string;
    createdAt: Date;
    updatedAt: Date;
};

export class User {
    constructor(
        public readonly id: string,
        public email: Email,
        public name: string,
        public role: UserRole,
        public password: PasswordHash | null,
        public passwordResetToken: PasswordHash | null,
        public passwordResetExpiresAt: Date | null,
        public mfaSecret: string | null,
        public mfaFactorConfirmedAt: Date | null,
        public phoneNumber: string | null,
        public emailVerified: Date | null,
        public isActive: boolean,
        public readonly createdAt: Date,
        public updatedAt: Date,

        // Relations (optional, loaded on demand)
        public mfaBackupCodes: MfaBackupCodes[] | null = null,
        public refreshTokens: RefreshToken[] | null = null,
        public doctorProfile: UserDoctorProfile | null = null,
        public patientAppointments: UserAppointment[] | null = null,
        public doctorAppointments: UserAppointment[] | null = null,
    ) { }

    static async create(data: {
        name: string;
        email: string;
        password?: string;
        role?: UserRole;
        phoneNumber?: string;
    }): Promise<User> {
        const emailVo = Email.create(data.email);
        const passwordHash = data.password
            ? await PasswordHash.create(data.password)
            : null;
        const now = new Date();

        return new User(
            randomUUID(),
            emailVo,
            data.name,
            data.role ?? UserRole.PATIENT,
            passwordHash,
            null,                      // passwordResetToken
            null,                      // passwordResetExpiresAt
            null,                      // mfaSecret
            null,                      // mfaFactorConfirmedAt
            data.phoneNumber ?? null,  // phoneNumber
            null,                      // emailVerified
            true,                      // isActive
            now,                       // createdAt
            now,                       // updatedAt
        );
    }

    isDoctor(): boolean {
        return this.role === UserRole.DOCTOR;
    }

    isPatient(): boolean {
        return this.role === UserRole.PATIENT;
    }

    isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    async verifyPassword(plain: string): Promise<boolean> {
        if (!this.password) return false;
        return this.password.compare(plain);
    }

    markEmailVerified(): void {
        this.emailVerified = new Date();
        this.updatedAt = new Date();
    }

    deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    isMFAEnabled(): boolean {
        return this.mfaSecret !== null && this.mfaFactorConfirmedAt !== null;
    }

    setMFASecret(secret: string): void {
        this.mfaSecret = secret;
        this.updatedAt = new Date();
    }

    enableMFA(): void {
        this.mfaFactorConfirmedAt = new Date();
        this.updatedAt = new Date();
    }

    disableMFA(): void {
        this.mfaSecret = null;
        this.mfaFactorConfirmedAt = null;
        this.updatedAt = new Date();
    }

    async requestPasswordReset(): Promise<string> {
        const token = randomUUID();
        this.passwordResetToken = await PasswordHash.create(token);
        this.passwordResetExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        this.updatedAt = new Date();
        return token;
    }

    async resetPassword(newPassword: string, token: string): Promise<void> {
        if (!this.passwordResetToken || !this.passwordResetExpiresAt) {
            throw new Error('No password reset requested');
        }
        if (this.passwordResetExpiresAt < new Date()) {
            throw new Error('Password reset token expired');
        }
        const isValid = await this.passwordResetToken.compare(token);
        if (!isValid) {
            throw new Error('Invalid password reset token');
        }
        this.password = await PasswordHash.create(newPassword);
        this.passwordResetToken = null;
        this.passwordResetExpiresAt = null;
        this.updatedAt = new Date();
    }
}