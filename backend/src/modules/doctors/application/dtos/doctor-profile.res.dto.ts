import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpecialtyResDto } from '@/modules/specialties/application/dtos/specialty.res.dto';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

export class DoctorProfileResDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    id: string;

    @ApiProperty({ example: 'f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c' })
    userId: string;

    @ApiProperty({ example: 'MED-123456' })
    licenseNumber: string;

    @ApiPropertyOptional({ example: 'Specialist in Cardiology' })
    bio?: string;

    @ApiPropertyOptional({ example: 150.0 })
    consultationFee?: number;

    @ApiProperty({ example: false })
    isVerified: boolean;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    avatar?: string;

    @ApiPropertyOptional({ example: 'Dr. John Doe' })
    doctorName?: string;

    @ApiPropertyOptional({ example: 'john.doe@example.com' })
    doctorEmail?: string;

    @ApiProperty({ type: [SpecialtyResDto] })
    specialties: SpecialtyResDto[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromEntity(entity: DoctorProfile): DoctorProfileResDto {
        const dto = new DoctorProfileResDto();
        dto.id = entity.id;
        dto.userId = entity.userId;
        dto.licenseNumber = entity.licenseNumber;
        dto.bio = entity.bio ?? undefined;
        dto.consultationFee = entity.consultationFee !== null && entity.consultationFee !== undefined ? Number(entity.consultationFee) : undefined;
        dto.isVerified = entity.isVerified;
        dto.avatar = entity.avatar ?? undefined;
        dto.doctorName = entity.doctorName ?? undefined;
        dto.doctorEmail = entity.doctorEmail ? entity.doctorEmail.toString() : undefined;
        dto.specialties = (entity.specialties || []).map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description ?? undefined,
            icon: s.icon ?? undefined,
            image: s.image ?? undefined,
        }));
        dto.createdAt = entity.createdAt;
        dto.updatedAt = entity.updatedAt;
        return dto;
    }
}
