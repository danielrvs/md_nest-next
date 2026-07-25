import { ICommand } from "@nestjs/cqrs";
import { MfaAuthenticated } from "../../domain/interfaces/mfa-authenticated.interface";

export class MfaChallengeCommand implements ICommand {
    constructor(
        public readonly user: MfaAuthenticated,
        public readonly totpCode: string
    ) { }
}