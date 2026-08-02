import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSpecialtyReqDto {
    @ApiPropertyOptional({
        example: 'Cardiovascular Medicine',
        description: 'Updated medical specialty name',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        example: 'cardiovascular-medicine',
        description: 'Updated URL-friendly slug',
    })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiPropertyOptional({
        example: 'Updated description',
        description: 'Updated description of the medical specialty',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        example: 'cardio-icon',
        description: 'Updated icon identifier or class name',
    })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/cardio-new.jpg',
        description: 'Updated image URL',
    })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Active status of the specialty',
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
