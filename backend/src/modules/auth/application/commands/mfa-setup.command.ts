import { ICommand } from "@nestjs/cqrs";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";

export class MfaSetupCommand implements ICommand {
    constructor(public readonly user: Authenticated) { }
}