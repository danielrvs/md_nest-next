import { UserRole } from "@/modules/users/domain/entities/enums/user-role.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterReqDto {
    @ApiProperty(
        {
            example: 'John Doe',
            required: true,
            description: 'Name of the user',
            type: 'string',
        }
    )
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty(
        {
            example: 'user@example.com',
            required: true,
            description: 'Email of the user',
            type: 'string',
        }
    )
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty(
        {
            example: 'password123456',
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
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty(
        {
            example: '4c7e5d9b-5f0e-4a0b-8b2e-5d9b5f0e4a0b',
            required: true,
            description: 'Tenant id of the user',
            type: 'string',
        }
    )
    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @ApiProperty(
        {
            example: 'viewer',
            required: false,
            description: 'Role of the user',
            type: 'string',
        }
    )
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}