import { ApiProperty } from "@nestjs/swagger";

export class RegisterResDto {
    @ApiProperty(
        {
            example: 'user@example.com',
            description: 'Email of the user',
            type: 'string',
        }
    )
    email: string;

    @ApiProperty(
        {
            example: 'John Doe',
            description: 'Name of the user',
            type: 'string',
        }
    )
    name: string;

    @ApiProperty(
        {
            example: 'user@example.com',
            description: 'Email of the user',
            type: 'string',
        }
    )
    tenantId: string;

    @ApiProperty(
        {
            example: 'user@example.com',
            description: 'Email of the user',
            type: 'string',
        }
    )
    createdAt: Date;
}