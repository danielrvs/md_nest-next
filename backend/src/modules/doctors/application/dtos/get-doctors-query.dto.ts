import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDoctorsQueryDto {
    @ApiPropertyOptional({
        example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        description: 'Filter verified doctors by specialty ID',
    })
    @IsUUID('4')
    @IsOptional()
    specialtyId?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number for pagination',
        default: 1,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of items per page',
        default: 10,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    perPage?: number = 10;
}
