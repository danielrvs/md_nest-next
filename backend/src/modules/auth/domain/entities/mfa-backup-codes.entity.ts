import { User } from "@/modules/users/domain/entities/user.entity";
import { PasswordHash } from "@/modules/users/domain/entities/vo/password-hash.vo";
import { randomUUID, randomBytes } from "crypto";

export class MfaBackupCodes {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly code: PasswordHash,
        public used: boolean,
        public readonly createdAt: Date,
        public updatedAt: Date,

        public readonly user: User | null = null
    ) {

    }

    static async create(data: {
        userId: string,
        code?: string
    }): Promise<MfaBackupCodes> {
        let codeHash: PasswordHash;
        if (data.code) {
            codeHash = await PasswordHash.create(data.code);
        } else {
            codeHash = await PasswordHash.create(MfaBackupCodes.generateCode());
        }
        return new MfaBackupCodes(
            randomUUID(),
            data.userId,
            codeHash,
            false,
            new Date(),
            new Date()
        );
    }

    static generateCode(): string {
        return randomBytes(5).toString("hex").toUpperCase();
    }

    use(): void {
        if (this.used) {
            throw new Error('Code already used');
        }
        this.used = true;
        this.updatedAt = new Date();
    }

}