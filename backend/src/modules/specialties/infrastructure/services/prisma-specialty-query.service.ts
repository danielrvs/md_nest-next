import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { SpecialtyQueryServicePort } from '../../application/ports/specialty-query.service.port';
import { SpecialtyResDto } from '../../application/dtos/specialty.res.dto';

@Injectable()
export class PrismaSpecialtyQueryService implements SpecialtyQueryServicePort {
    constructor(private readonly prisma: PrismaService) {}

    async findActiveSpecialties(): Promise<SpecialtyResDto[]> {
        const items = await this.prisma.specialty.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return items.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description ?? undefined,
            icon: s.icon ?? undefined,
            image: s.image ?? undefined,
            isActive: s.isActive,
        }));
    }

    async findAllSpecialties(): Promise<SpecialtyResDto[]> {
        const items = await this.prisma.specialty.findMany({
            orderBy: { name: 'asc' },
        });
        return items.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description ?? undefined,
            icon: s.icon ?? undefined,
            image: s.image ?? undefined,
            isActive: s.isActive,
        }));
    }

    async invalidateCache(): Promise<void> {
        // No-op for primary DB provider
    }
}
