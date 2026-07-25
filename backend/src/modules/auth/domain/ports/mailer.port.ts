import { User } from "@/modules/users/domain/entities/user.entity";

export abstract class MailerPort {
    abstract sendWelcomeEmail(tenantId: string, to: string, name: string): Promise<void>;
    abstract sendForgotPasswordEmail(email: string, name: string, tenantId: string, userId: string, token: string): Promise<void>;
    abstract sendResetPasswordEmail(email: string, name: string, tenantId: string, userId: string): Promise<void>;
}