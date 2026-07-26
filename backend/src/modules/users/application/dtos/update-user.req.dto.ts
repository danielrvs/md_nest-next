import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";
import { UserRole } from "../../domain/entities/enums/user-role.enum";

export class UpdateUserReqDto {
    @ApiProperty({
        example: 'Juan De la Rosa',
        description: 'Full name of the user'
    })
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty(
        { example: 'user@example.com', description: 'Email of the user' }
    )
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty({
        example: 'StrongP@ssw0rd!',
        description: 'Password of the user'
    })
    @IsString()
    @IsOptional()
    password: string;

    @ApiProperty({
        example: 'StrongP@ssw0rd!',
        description: 'Password confirmation of the user'
    })
    @IsString()
    @ValidateIf((o) => o.password !== undefined)
    passwordConfirmation: string;

    @ApiProperty({
        example: UserRole.ADMIN,
        enum: UserRole,
        description: 'Role of the user'
    })
    @IsEnum(UserRole)
    @IsOptional()
    role: UserRole;
}