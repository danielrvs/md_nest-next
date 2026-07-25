import { Injectable } from "@nestjs/common";
import { TokenGeneratorPort, TokenPayload } from "../../domain/ports/token-generator.port";
import { User } from "@/modules/users/domain/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import { MfaAuthenticated } from "../../domain/interfaces/mfa-authenticated.interface";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtTokenGeneratorAdapter implements TokenGeneratorPort {
    constructor(
        private readonly jwtService: JwtService,
        private readonly authConfig: ConfigService,
    ) { }

    async generateToken(user: User): Promise<TokenPayload> {
        const payload: Authenticated = {
            userId: user.id,
            tenantId: user.tenantId,
            name: user.name,
            email: user.email.toString(),
            role: user.role,
            isMfaPending: false
        }
        const expiresIn = this.authConfig.get<number>('auth.accessTokenExpiry');
        const accessToken = this.jwtService.sign(payload, { expiresIn: `${expiresIn}s` });
        
        const refreshExpiresIn = this.authConfig.get<number>('auth.refreshTokenExpiry');
        const refreshToken = this.jwtService.sign(
            { userId: user.id, jti: randomUUID() },
            { expiresIn: `${refreshExpiresIn}s` }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn
        };
    }

    async generateMfaToken(user: User): Promise<string> {

        const expiresIn = this.authConfig.get<number>('auth.accessTokenExpiry');
        const payload: MfaAuthenticated = {
            userId: user.id,
            isMfaPending: true
        }
        const mfaToken = this.jwtService.sign(payload, { expiresIn: `${expiresIn}s` });

        return mfaToken;
    }
}