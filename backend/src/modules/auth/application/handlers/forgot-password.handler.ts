import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ForgotPasswordCommand } from "../commands/forgot-password.command";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { ForgotPasswordEvent } from "../../domain/events/forgot-password.event";


@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: ForgotPasswordCommand): Promise<void> {
        const user = await this.userRepository.findByEmail(command.email);
        if (!user) throw new NotFoundException('User not found');

        const token = await user.requestPasswordReset();
        await this.userRepository.update(user.id, user);

        this.eventBus.publish(new ForgotPasswordEvent(user, token));
        //TODO: outbox pattern, but too long for a demo project :( 
    }
}
