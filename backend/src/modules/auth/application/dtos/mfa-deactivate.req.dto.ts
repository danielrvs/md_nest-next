import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Length } from "class-validator";

export class MfaDeactivateReqDto {
    @ApiProperty({
        description: 'The TOTP code to verify',
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsNumberString({}, { message: 'The TOTP code must be a number' })
    @IsNotEmpty()
    @Length(6, 6, { message: 'The TOTP code must be 6 digits long' })
    totpCode: string;
}