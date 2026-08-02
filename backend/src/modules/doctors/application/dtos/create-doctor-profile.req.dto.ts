import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDoctorProfileReqDto {
    @ApiProperty({
        example: 'MED-123456',
        description: 'Professional medical license number',
    })
    @IsString()
    @IsNotEmpty()
    licenseNumber: string;

    @ApiPropertyOptional({
        example: 'Specialist in Cardiology with over 10 years of clinical experience.',
        description: 'Professional biography of the doctor',
    })
    @IsString()
    @IsOptional()
    bio?: string;

    @ApiPropertyOptional({
        example: 150.0,
        description: 'Consultation fee amount',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    consultationFee?: number;

    @ApiPropertyOptional({
        example: ['9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'],
        description: 'Array of specialty UUIDs associated with the doctor',
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    specialtyIds?: string[];

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'URL of the doctor avatar image',
    })
    @IsString()
    @IsOptional()
    avatar?: string;
}
