import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { ResetPasswordEvent } from "../../domain/events/reset-password.event";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@EventsHandler(ResetPasswordEvent)
export class ResetPasswordEventHandler implements IEventHandler<ResetPasswordEvent> {
    constructor(
        @InjectQueue('auth-emails') private readonly emailQueue: Queue
    ) { }

    async handle(event: ResetPasswordEvent): Promise<void> {
        await this.emailQueue.add('reset-password', {
            email: event.user.email.toString(),
            name: event.user.name,
            tenantId: event.user.tenantId,
            userId: event.user.id,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1500 },
        });
    }
}