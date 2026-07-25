export abstract class MfaValidatorPort {
    abstract validate(mfaSecret: string, mfaToken: string): Promise<boolean>;
}