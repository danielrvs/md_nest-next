import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { MfaChallengeCommand } from "../commands/mfa-challenge.command";
import { UserRepositoryPort } from "../../../users/domain/ports/user.repository.port";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { LoginResDto } from "../dtos/login.res.dto";
import { TokenGeneratorPort, TokenPayload } from "../../domain/ports/token-generator.port";
import { RefreshTokenRepositoryPort } from "../../domain/ports/refresh-token.repository.port";
import { User } from "@/modules/users/domain/entities/user.entity";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { MfaValidatorPort } from "../../domain/ports/mfa-validator.port";

@CommandHandler(MfaChallengeCommand)
export class MfaChallengeHandler implements ICommandHandler<MfaChallengeCommand, LoginResDto> {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly tokenGenerator: TokenGeneratorPort,
        private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
        private readonly mfaValidator: MfaValidatorPort
    ) { }

    async execute(command: MfaChallengeCommand): Promise<LoginResDto> {
        const { userId } = command.user;
        const { totpCode } = command;

        const user = await this.userRepository.findById(userId);
        if (!user) throw new UnauthorizedException("Invalid credentials");

        if (!user.isMFAEnabled()) throw new UnauthorizedException("MFA is not enabled");

        const isMfaCodeValid = await this.mfaValidator.validate(user.mfaSecret, totpCode);
        if (!isMfaCodeValid) throw new UnauthorizedException("Invalid MFA code");

        return await this.loginToken(user);
    }

    private async loginToken(user: User): Promise<LoginResDto> {
        const token = await this.generateToken(user);
        await this.saveRefreshToken(token.refreshToken, user);
        return {
            accessToken: token.accessToken,
            user: {
                id: user.id,
                tenantId: user.tenantId,
                name: user.name,
                email: user.email.toString(),
                role: user.role
            },
            expiresIn: token.expiresIn,
            refreshToken: token.refreshToken,
            mfaRequired: false
        }
    }

    private async generateToken(user: User): Promise<TokenPayload> {
        return this.tokenGenerator.generateToken(user);
    }

    private async saveRefreshToken(refreshToken: string, user: User): Promise<void> {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const newRefreshToken = RefreshToken.create(user.id, refreshToken, expiresAt);
        await this.refreshTokenRepository.create(newRefreshToken);
    }
}