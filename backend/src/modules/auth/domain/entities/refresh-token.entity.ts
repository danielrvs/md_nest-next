import { createHash, randomUUID } from "crypto";

export class RefreshToken {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly token: string,
        public readonly expiresAt: Date,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {

    }

    static create(userId: string, token: string, expiresAt: Date): RefreshToken {
        const now = new Date();
        const hashedToken = RefreshToken.hashToken(token);
        return new RefreshToken(
            randomUUID(),
            userId,
            hashedToken,
            expiresAt,
            now,
            now
        )
    }

    static hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
