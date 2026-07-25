import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../domain/entities/enums/user-role.enum";

export class UserResDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Unique ID from the created user'
    })
    id: string;

    @ApiProperty({
        example: 'Juan',
        description: 'Full name of the user'
    })
    name: string;


    @ApiProperty({
        example: 'user@example.com',
        description: 'Email of the user'
    })
    email: string;

    @ApiProperty({
        example: UserRole.ADMIN,
        enum: UserRole,
        description: 'Role of the user'
    })
    role: UserRole;

    @ApiProperty({
        example: '2026-01-15T10:30:00.000Z',
        description: 'Date when the user was created'
    })
    createdAt: string;

    @ApiProperty({
        example: '2026-01-15T10:30:00.000Z',
        description: 'Date when the user was updated'
    })
    updatedAt: string;
}