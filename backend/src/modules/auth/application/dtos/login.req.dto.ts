import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginReqDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email of the user',
        required: true
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password',
        description: 'Password of the user',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    password: string;

}