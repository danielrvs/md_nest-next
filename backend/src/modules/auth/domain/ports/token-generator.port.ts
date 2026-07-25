import { User } from "@/modules/users/domain/entities/user.entity";


export interface TokenPayload {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}


export abstract class TokenGeneratorPort {
    abstract generateToken(user: User): Promise<TokenPayload>;
    abstract generateMfaToken(user: User): Promise<string>;
}