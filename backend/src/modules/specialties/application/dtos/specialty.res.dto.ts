import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialtyResDto {
    @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
    id: string;

    @ApiProperty({ example: 'Cardiology' })
    name: string;

    @ApiProperty({ example: 'cardiology' })
    slug: string;

    @ApiPropertyOptional({ example: 'Heart and cardiovascular care' })
    description?: string;

    @ApiPropertyOptional({ example: 'heart-icon' })
    icon?: string;

    @ApiPropertyOptional({ example: 'https://example.com/cardiology.jpg' })
    image?: string;

    @ApiPropertyOptional({ example: true })
    isActive?: boolean;
}
