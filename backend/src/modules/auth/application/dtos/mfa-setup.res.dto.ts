import { ApiProperty } from "@nestjs/swagger";

export class MfaSetupResDto {
    @ApiProperty({
        example: 'otpauth://totp/TaskFlow?secret=JBSWY3DPEHPK3PXP&issuer=TaskFlow'
    })
    readonly qrCodeUri: string;
}