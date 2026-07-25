import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { MailerPort } from "../../domain/ports/mailer.port";

@Processor('auth-emails')
export class MailProcessor extends WorkerHost {

    constructor(private readonly mailer: MailerPort) {
        super()
    }

    async process(job: Job<any>): Promise<any> {
        if (job.name === 'send-welcome') {
            await this.mailer.sendWelcomeEmail(job.data.tenantId, job.data.email, job.data.name)
        }
        if (job.name === 'forgot-password') {
            await this.mailer.sendForgotPasswordEmail(job.data.email, job.data.name, job.data.tenantId, job.data.userId, job.data.token)
        }
        if (job.name === 'reset-password') {
            await this.mailer.sendResetPasswordEmail(job.data.email, job.data.name, job.data.tenantId, job.data.userId)
        }
    }
}