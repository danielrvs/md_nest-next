import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { MfaDeactivateCommand } from "../commands/mfa-deactivate.command";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { MfaValidatorPort } from "../../domain/ports/mfa-validator.port";
import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { MfaBackupCodesRepositoryPort } from "../../domain/ports/mfa-backup-codes.repository.port";

@CommandHandler(MfaDeactivateCommand)
export class MfaDeactivateHandler implements ICommandHandler<MfaDeactivateCommand> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly mfaBackupCodesRepository: MfaBackupCodesRepositoryPort,
        private readonly mfaValidator: MfaValidatorPort
    ) { }

    async execute(command: MfaDeactivateCommand): Promise<void> {
        const { user, totpCode } = command;

        const userFound = await this.userRepository.findById(user.userId);

        if (!userFound) {
            throw new NotFoundException('User not found');
        }

        if (!userFound.isMFAEnabled()) {
            throw new BadRequestException('MFA is not activated');
        }


        const isValid = await this.mfaValidator.validate(userFound.mfaSecret, totpCode);

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA code');
        }

        userFound.disableMFA();
        await this.userRepository.update(userFound.id, userFound);
        await this.mfaBackupCodesRepository.deleteByUserId(userFound.id);
    }
}