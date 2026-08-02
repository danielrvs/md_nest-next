import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyReqDto {
    @ApiProperty({
        example: 'Cardiology',
        description: 'Medical specialty name',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'cardiology',
        description: 'URL-friendly slug (auto-generated if omitted)',
    })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiPropertyOptional({
        example: 'Specialties focused on heart and cardiovascular conditions.',
        description: 'Description of the medical specialty',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        example: 'heart-icon',
        description: 'Icon identifier or class name',
    })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/cardiology.jpg',
        description: 'Image URL for the specialty',
    })
    @IsString()
    @IsOptional()
    image?: string;
}
