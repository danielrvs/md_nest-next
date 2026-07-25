import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { UserRegisteredEvent } from "../../domain/events/user-registered.event";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredEventHandler implements IEventHandler<UserRegisteredEvent> {

    constructor(@InjectQueue('auth-emails') private readonly emailQueue: Queue) {

    }

    async handle(event: UserRegisteredEvent): Promise<void> {
        await this.emailQueue.add('send-welcome', {
            tenantId: event.tenantId,
            email: event.email,
            name: event.name,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1500 }
        })
    }
}