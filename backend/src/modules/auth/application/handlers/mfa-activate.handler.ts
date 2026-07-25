import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { MfaActivateCommand } from "../commands/mfa-activate.command";
import { MfaValidatorPort } from "../../domain/ports/mfa-validator.port";
import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { MfaBackupCodesRepositoryPort } from "../../domain/ports/mfa-backup-codes.repository.port";
import { BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { MfaBackupCodes } from "../../domain/entities/mfa-backup-codes.entity";
import { ConfigService } from "@nestjs/config";

@CommandHandler(MfaActivateCommand)
export class MfaActivateHandler implements ICommandHandler<MfaActivateCommand> {

    private readonly backupCodesCount: number;

    constructor(private readonly mfaValidator: MfaValidatorPort,
        private readonly userRepository: UserRepositoryPort,
        private readonly mfaBackupCodesRepository: MfaBackupCodesRepositoryPort,
        private readonly configService: ConfigService,
    ) {

        this.backupCodesCount = this.configService.get<number>('auth.backupCodesCount', 8);
    }

    async execute(command: MfaActivateCommand): Promise<string[]> {
        const { user, totpCode } = command;


        const userFound = await this.userRepository.findById(user.userId);

        if (!userFound) {
            throw new NotFoundException('User not found');
        }

        if (userFound.isMFAEnabled()) {
            throw new BadRequestException('MFA is already activated');
        }

        if (!userFound.mfaSecret) {
            throw new InternalServerErrorException('MFA secret not found');
        }

        const isValid = await this.mfaValidator.validate(userFound.mfaSecret, totpCode);

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA code');
        }

        userFound.enableMFA();

        await this.userRepository.update(userFound.id, userFound);

        const backupCodes: MfaBackupCodes[] = [];
        const plainTextCodes: string[] = [];

        for (let i = 0; i < this.backupCodesCount; i++) {
            const code = MfaBackupCodes.generateCode();
            plainTextCodes.push(code);
            const backupCode = await MfaBackupCodes.create({ userId: userFound.id, code });
            backupCodes.push(backupCode);
        }

        await this.mfaBackupCodesRepository.createMany(backupCodes);

        return plainTextCodes;

    }
}