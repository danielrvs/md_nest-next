/**
 * Port for sending transactional authentication emails.
 */
export abstract class MailerPort {
    abstract sendWelcomeEmail(to: string, name: string): Promise<void>;
    abstract sendForgotPasswordEmail(email: string, name: string, userId: string, token: string): Promise<void>;
    abstract sendResetPasswordEmail(email: string, name: string, userId: string): Promise<void>;
}