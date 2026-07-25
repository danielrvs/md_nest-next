import { ApiProperty } from "@nestjs/swagger";

export class LoginResDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzE2NzE5NzcyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        description: 'JWT token',
        required: true
    })
    accessToken: string;

    @ApiProperty({
        example: 60 * 60 * 24 * 7,
        description: 'JWT token expiration time in seconds',
        required: true
    })
    expiresIn: number;

    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzE2NzE5NzcyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        description: 'JWT refresh token',
        required: true
    })
    refreshToken: string;

    @ApiProperty({
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            tenantId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John Doe',
            email: 'user@example.com',
            role: 'ADMIN'
        },
        description: 'User data',
        required: true
    })
    user: {
        id: string;
        tenantId: string;
        name: string;
        email: string;
        role: string;
    };

    @ApiProperty({
        example: false,
        description: 'Two factor authentication required',
        required: true
    })
    mfaRequired: boolean;


}