import type { MfaSetup } from "../interfaces/mfa-setup.interface";

export abstract class MfaGeneratorPort {
    abstract generateMfaSetup(email: string, issuer: string): Promise<MfaSetup>;
}