import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { NotFoundException } from "@nestjs/common";
import { ResetPasswordCommand } from "../commands/reset-password.command";
import { ResetPasswordEvent } from "../../domain/events/reset-password.event";


@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: ResetPasswordCommand): Promise<void> {
        const user = await this.userRepository.findByEmail(command.email);
        if (!user) throw new NotFoundException('User not found');

        await user.resetPassword(command.password, command.token);
        await this.userRepository.update(user.id, user);

        this.eventBus.publish(new ResetPasswordEvent(user));
    }
}