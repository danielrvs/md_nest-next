import { User } from "@/modules/users/domain/entities/user.entity";

export class ResetPasswordEvent {
    constructor(public readonly user: User) { }
}