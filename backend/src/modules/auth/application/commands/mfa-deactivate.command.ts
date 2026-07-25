import { ICommand } from "@nestjs/cqrs";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";

export class MfaDeactivateCommand implements ICommand {
    constructor(
        public readonly user: Authenticated,
        public readonly totpCode: string
    ) { }
}