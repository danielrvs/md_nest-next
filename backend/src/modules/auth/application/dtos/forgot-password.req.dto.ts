import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordReqDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email of the user',
        required: true
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

}