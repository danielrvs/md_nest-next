import { ApiProperty } from '@nestjs/swagger';
import { DoctorProfileResDto } from './doctor-profile.res.dto';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

export class DoctorListResDto {
    @ApiProperty({ type: [DoctorProfileResDto] })
    items: DoctorProfileResDto[];

    @ApiProperty({ example: 42 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    perPage: number;

    static fromPaginated(data: {
        items: DoctorProfile[];
        total: number;
        page: number;
        perPage: number;
    }): DoctorListResDto {
        const dto = new DoctorListResDto();
        dto.items = data.items.map((item: DoctorProfile) => DoctorProfileResDto.fromEntity(item));
        dto.total = data.total;
        dto.page = data.page;
        dto.perPage = data.perPage;
        return dto;
    }
}
