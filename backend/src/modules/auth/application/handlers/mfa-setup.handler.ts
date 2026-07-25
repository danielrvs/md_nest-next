import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { MfaSetupCommand } from "../commands/mfa-setup.command";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { MfaBackupCodesRepositoryPort } from "../../domain/ports/mfa-backup-codes.repository.port";
import { MfaGeneratorPort } from "../../domain/ports/mfa-generator.port";
import { NotFoundException } from "@nestjs/common";


@CommandHandler(MfaSetupCommand)
export class MfaSetupHandler implements ICommandHandler<MfaSetupCommand, string> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly mfaGenerator: MfaGeneratorPort
    ) { }
    async execute(command: MfaSetupCommand): Promise<string> {

        const { user } = command;

        const userFound = await this.userRepository.findByIdWithTenant(user.userId);
        if (!userFound) throw new NotFoundException("User not found");

        const { secret, qrCodeUri } = await this.mfaGenerator.generateMfaSetup(userFound.email.toString(), userFound.tenant.name.toString());


        userFound.setMFASecret(secret);

        await this.userRepository.update(userFound.id, userFound);

        return qrCodeUri;
    }
}