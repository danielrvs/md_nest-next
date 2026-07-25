import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEmpty, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { UserRole } from "generated/prisma/enums";

export class UpdateUserReqDto {
    @ApiProperty(
        { example: '123e4567-e89b-12d3-a456-426614174000', description: 'Unique ID from the tenant. Only Superadmin.' }
    )
    @IsString()
    @IsOptional()
    tenantId: string;

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
        description: 'Role of the user in the tenant'
    })
    @IsEnum(UserRole)
    @IsOptional()
    role: UserRole;
}