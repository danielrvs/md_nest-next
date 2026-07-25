import { User } from "@/modules/users/domain/entities/user.entity";

export class ForgotPasswordEvent {
    constructor(
        public readonly user: User,
        public readonly token: string,
    ) { }
}