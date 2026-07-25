import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { RegisterCommand } from "../commands/register.command";
import { RegisterResDto } from "../dtos/register.res.dto";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { User } from "@/modules/users/domain/entities/user.entity";
import { UserRole } from "@/modules/users/domain/entities/enums/user-role.enum";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { UserRegisteredEvent } from "../../domain/events/user-registered.event";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResDto> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: RegisterCommand): Promise<RegisterResDto> {
        await this.isUserRegisteredInTenant(command.email, command.tenantId);
        const user = await this.persistUser(command);
        await this.sendEvent(user);
        // TODO: should be implemented outbox pattern here, but this is a portfolio project...
        // if i were to implement outbox pattern here i would need to:
        // 1. create a outbox table
        // 2. create a job queue
        // 3. create a poller
        // 4. create a consumer
        // 5. create a event listener
        // 6. create a transaction to insert the event in the outbox table
        // 7. create a poller to poll the outbox table
        // 8. create a consumer to consume the outbox table
        // 9. create a event listener to listen for the event...

        return {
            email: user.email.toString(),
            name: user.name,
            tenantId: user.tenantId,
            createdAt: user.createdAt
        }
    }

    private async isUserRegisteredInTenant(
        email: string,
        tenantId: string
    ): Promise<void> {
        const foundUser = await this.userRepository.findByEmailAndTenantId(email, tenantId)

        if (foundUser) {
            throw new ConflictException('User with email ' + email + ' already exists in this tenant.')
        }
    }

    private async persistUser(command: RegisterCommand): Promise<User> {
        const user = await User.create({
            name: command.name,
            email: command.email,
            password: command.password,
            tenantId: command.tenantId,
            role: command.role as UserRole ?? UserRole.VIEWER
        })
        return await this.userRepository.create(user)
    }

    private async sendEvent(user: User): Promise<void> {
        await this.eventBus.publish(new UserRegisteredEvent(
            user.id,
            user.tenantId,
            user.email.toString(),
            user.name,
            user.role
        ))
    }
}