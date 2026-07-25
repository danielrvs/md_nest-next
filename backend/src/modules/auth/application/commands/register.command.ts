import { UserRole } from "@/modules/users/domain/entities/enums/user-role.enum";
import { ICommand } from "@nestjs/cqrs";

export class RegisterCommand implements ICommand {
    constructor(
        public readonly name: string,
        public readonly email: string,
        public readonly password: string,
        public readonly tenantId: string,
        public readonly role?: string | UserRole,
    ) { }
}