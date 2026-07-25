import { ApiProperty } from "@nestjs/swagger";

export class MFALoginResDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzE2NzE5NzcyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        description: 'JWT token',
        required: true
    })
    mfaToken: string;

    @ApiProperty({
        example: 60 * 60 * 24 * 7,
        description: 'JWT token expiration time in seconds',
        required: true
    })
    expiresIn: number;

    @ApiProperty({
        example: false,
        description: 'Two factor authentication enabled',
        required: true
    })
    mfaRequired: boolean;


}