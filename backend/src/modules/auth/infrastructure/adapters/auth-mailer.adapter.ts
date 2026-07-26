import { Injectable } from "@nestjs/common";
import { MailerPort } from "../../domain/ports/mailer.port";

@Injectable()
export class AuthMailerAdapter implements MailerPort {
    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        console.log('Sending welcome email to ' + to + ' with name ' + name)
    }

    async sendForgotPasswordEmail(email: string, name: string, userId: string, token: string): Promise<void> {
        console.log('Sending forgot password email to ' + email + ' with name ' + name + ' and token ' + token)
    }

    async sendResetPasswordEmail(email: string, name: string, userId: string): Promise<void> {
        console.log('Sending reset password email to ' + email + ' with name ' + name)
    }
}