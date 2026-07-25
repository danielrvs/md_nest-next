import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordReqDto {

    @ApiProperty({
        description: 'Email of the user',
        example: 'user@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Password Reset Token',
        example: 'token'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    token: string;

    @ApiProperty(
        {
            example: 'Password123456',
            required: true,
            description: 'Password of the user. Must contain at least one lowercase letter, one uppercase letter, and one number',
            type: 'string',
            minLength: 8,
        }
    )
    @MinLength(8, {
        message: 'Password must be at least 8 characters long',
    })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    })
    @IsNotEmpty()
    @IsString()
    password: string;

}