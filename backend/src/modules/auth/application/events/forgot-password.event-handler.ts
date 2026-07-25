import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { ForgotPasswordEvent } from "../../domain/events/forgot-password.event";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@EventsHandler(ForgotPasswordEvent)
export class ForgotPasswordEventHandler implements IEventHandler<ForgotPasswordEvent> {
    constructor(
        @InjectQueue('auth-emails') private readonly emailQueue: Queue
    ) { }

    async handle(event: ForgotPasswordEvent): Promise<void> {
        await this.emailQueue.add('forgot-password', {
            email: event.user.email.toString(),
            name: event.user.name,
            token: event.token,
            tenantId: event.user.tenantId,
            userId: event.user.id,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1500 },
        });
    }
}
