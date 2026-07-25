import { RefreshToken } from "../entities/refresh-token.entity";

export abstract class RefreshTokenRepositoryPort {
    abstract create(refreshToken: RefreshToken): Promise<RefreshToken>;
    abstract findByTokenAndUserId(token: string, userId: string): Promise<RefreshToken | null>;
    abstract delete(token: string, userId: string): Promise<void>;
    abstract deleteAllByUserId(userId: string): Promise<void>;
}