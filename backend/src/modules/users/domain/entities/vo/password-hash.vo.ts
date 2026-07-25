import * as bcrypt from 'bcrypt';

export class PasswordHash {
    constructor(private readonly value: string) { }

    public async compare(plainPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, this.value)
    }

    public static async create(plainPassword: string): Promise<PasswordHash> {
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        return new PasswordHash(hash);
    }

    public static fromHash(hash: string): PasswordHash {
        return new PasswordHash(hash);
    }

    public toString(): string {
        return this.value;
    }

}