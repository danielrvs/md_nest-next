import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { DoctorProfileRepositoryPort } from '../../domain/ports/doctor-profile.repository.port';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';
import { DoctorProfileMapper } from '../mappers/doctor-profile.mapper';

@Injectable()
export class PrismaDoctorProfileRepository implements DoctorProfileRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async create(entity: DoctorProfile, specialtyIds?: string[]): Promise<DoctorProfile> {
        return this.save(entity, specialtyIds);
    }

    async createMany(entities: DoctorProfile[]): Promise<{ count: number }> {
        for (const entity of entities) {
            await this.save(entity);
        }
        return { count: entities.length };
    }

    async save(profile: DoctorProfile, specialtyIds?: string[]): Promise<DoctorProfile> {
        const created = await this.prisma.doctorProfile.upsert({
            where: { id: profile.id },
            create: DoctorProfileMapper.toCreateInput(profile, specialtyIds),
            update: DoctorProfileMapper.toUpdateInput(profile, specialtyIds),
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
                doctor: true,
            },
        });

        return DoctorProfileMapper.toDomain(created);
    }

    async findByUserId(userId: string): Promise<DoctorProfile | null> {
        const found = await this.prisma.doctorProfile.findUnique({
            where: { userId },
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
                doctor: true,
            },
        });

        return found ? DoctorProfileMapper.toDomain(found) : null;
    }

    async findById(id: string): Promise<DoctorProfile | null> {
        const found = await this.prisma.doctorProfile.findUnique({
            where: { id },
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
                doctor: true,
            },
        });

        return found ? DoctorProfileMapper.toDomain(found) : null;
    }

    async findByLicenseNumber(licenseNumber: string): Promise<DoctorProfile | null> {
        const found = await this.prisma.doctorProfile.findUnique({
            where: { licenseNumber },
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
                doctor: true,
            },
        });

        return found ? DoctorProfileMapper.toDomain(found) : null;
    }
}
