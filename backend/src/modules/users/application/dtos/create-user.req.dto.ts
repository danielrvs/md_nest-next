import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole } from "../../domain/entities/enums/user-role.enum";

export class CreateUserReqDto {
    @ApiProperty({
        example: 'Juan De la Rosa',
        description: 'Full name of the user'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty(
        { example: 'user@example.com', description: 'Email of the user' }
    )
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongP@ssw0rd!',
        description: 'Password of the user'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: 'StrongP@ssw0rd!',
        description: 'Password confirmation of the user'
    })
    @IsString()
    @IsNotEmpty()
    passwordConfirmation: string;

    @ApiProperty({
        example: UserRole.ADMIN,
        enum: UserRole,
        description: 'Role of the user'
    })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
}