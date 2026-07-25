export class Email {
    constructor(private readonly value: string) { }

    public static create(value: string): Email {
        if (!Email.isValid(value)) {
            throw new Error(`The email <${value}> is not valid`);
        }
        return new Email(value);
    }

    public equals(other: Email): boolean {
        return this.value === other.value;
    }

    public getDomain(): string {
        return this.value.split('@')[1];
    }

    public getUsername(): string {
        return this.value.split('@')[0];
    }

    public static isValid(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    public toString(): string {
        return this.value;
    }
}