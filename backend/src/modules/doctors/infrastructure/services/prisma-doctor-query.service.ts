import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { DoctorQueryServicePort } from '../../application/ports/doctor-query.service.port';
import { DoctorListResDto } from '../../application/dtos/doctor-list.res.dto';
import { DoctorProfileMapper } from '../mappers/doctor-profile.mapper';

@Injectable()
export class PrismaDoctorQueryService implements DoctorQueryServicePort {
    constructor(private readonly prisma: PrismaService) {}

    async findVerifiedDoctors(params: {
        specialtyId?: string;
        page: number;
        perPage: number;
    }): Promise<DoctorListResDto> {
        const { specialtyId, page, perPage } = params;
        const skip = (page - 1) * perPage;

        const whereCondition: any = {
            isVerified: true,
        };

        if (specialtyId) {
            whereCondition.specialties = {
                some: {
                    specialtyId,
                },
            };
        }

        const [items, total] = await Promise.all([
            this.prisma.doctorProfile.findMany({
                where: whereCondition,
                skip,
                take: perPage,
                orderBy: { createdAt: 'desc' },
                include: {
                    specialties: {
                        include: {
                            specialty: true,
                        },
                    },
                    doctor: true,
                },
            }),
            this.prisma.doctorProfile.count({ where: whereCondition }),
        ]);

        const domainItems = items.map(DoctorProfileMapper.toDomain);
        return DoctorListResDto.fromPaginated({
            items: domainItems,
            total,
            page,
            perPage,
        });
    }
}
