import { ApiProperty } from "@nestjs/swagger";

export class MfaActivateResDto {
    @ApiProperty({
        example: ["123456", "123456", "123456", "123456", "123456", "123456", "123456", "123456"],
        description: "Backup codes for MFA, you should save them in a secure place"
    })
    backupCodes: string[];

}