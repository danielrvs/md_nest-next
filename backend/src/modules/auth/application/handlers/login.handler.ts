import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LoginCommand } from "../commands/login.command";
import { UserRepositoryPort } from "../../../users/domain/ports/user.repository.port";
import { UnauthorizedException } from "@nestjs/common";
import { User } from "@/modules/users/domain/entities/user.entity";
import { LoginResDto } from "../dtos/login.res.dto";
import { TokenGeneratorPort, TokenPayload } from "../../domain/ports/token-generator.port";
import { MFALoginResDto } from "../dtos/mfa-login.res.dto";
import { RefreshTokenRepositoryPort } from "../../domain/ports/refresh-token.repository.port";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { ConfigService } from "@nestjs/config";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
    private readonly accessTokenExpiresIn: number;
    private readonly refreshTokenExpiresIn: number;
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly tokenGenerator: TokenGeneratorPort,
        private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
        private readonly configService: ConfigService
    ) {
        this.accessTokenExpiresIn = this.configService.get<number>('auth.accessTokenExpiry');
        this.refreshTokenExpiresIn = this.configService.get<number>('auth.refreshTokenExpiry');
    }

    async execute(command: LoginCommand): Promise<LoginResDto | MFALoginResDto> {

        const { email, password } = command;
        const user = await this.findUser(email);
        await this.validatePassword(user, password);
        if (user.isMFAEnabled()) return await this.mfaToken(user);
        return await this.loginToken(user);
    }

    private async findUser(email: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new UnauthorizedException("The credentials are not valid");
        return user;
    }

    private async validatePassword(user: User, password: string): Promise<void> {
        const isMatch = await user.password.compare(password);
        if (!isMatch) throw new UnauthorizedException("The credentials are not valid");
    }

    private async generateToken(user: User): Promise<TokenPayload> {
        return this.tokenGenerator.generateToken(user);
    }

    private async mfaToken(user: User): Promise<MFALoginResDto> {
        const mfaToken = await this.tokenGenerator.generateMfaToken(user);
        return {
            mfaToken: mfaToken,
            expiresIn: this.accessTokenExpiresIn,
            mfaRequired: true
        }
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
            expiresIn: this.accessTokenExpiresIn,
            refreshToken: token.refreshToken,
            mfaRequired: false
        }
    }

    private async saveRefreshToken(refreshToken: string, user: User): Promise<void> {
        const expiresAt = new Date(Date.now() + this.refreshTokenExpiresIn);
        const newRefreshToken = RefreshToken.create(user.id, refreshToken, expiresAt);
        await this.refreshTokenRepository.create(newRefreshToken);
    }
}
