import { MfaGeneratorPort } from "../../domain/ports/mfa-generator.port";
import { Injectable } from "@nestjs/common";
import type { MfaSetup } from "../../domain/interfaces/mfa-setup.interface";
import { generateSecret, generateURI } from "otplib";

@Injectable()
export class OtplibMfaGeneratorAdapter implements MfaGeneratorPort {
    async generateMfaSetup(email: string, issuer: string): Promise<MfaSetup> {
        const secret = await generateSecret();
        const qrCodeUri = generateURI({
            issuer: issuer,
            label: email,
            secret: secret,
        });
        return { secret, qrCodeUri };
    }
} 