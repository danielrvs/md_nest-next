import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LogoutCommand } from "../commands/logout.command";
import { RefreshTokenRepositoryPort } from "../../domain/ports/refresh-token.repository.port";
import { UnauthorizedException } from "@nestjs/common";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {

    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepositoryPort
    ) { }

    async execute(command: LogoutCommand): Promise<void> {
        const { refreshToken, userId } = command;

        if (!refreshToken) throw new UnauthorizedException("Cookie 'refresh-token' not provided");

        const hashedToken = RefreshToken.hashToken(refreshToken);
        // silently ignore if the token doesn't exist or (already logged out)
        return await this.refreshTokenRepository.delete(hashedToken, userId);
    }
}