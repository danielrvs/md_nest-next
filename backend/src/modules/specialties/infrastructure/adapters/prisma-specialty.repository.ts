import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { Specialty } from '../../domain/entities/specialty.entity';
import { SpecialtyMapper } from '../mappers/specialty.mapper';

@Injectable()
export class PrismaSpecialtyRepository implements SpecialtyRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async create(entity: Specialty): Promise<Specialty> {
        return this.save(entity);
    }

    async createMany(entities: Specialty[]): Promise<{ count: number }> {
        for (const entity of entities) {
            await this.save(entity);
        }
        return { count: entities.length };
    }

    async save(specialty: Specialty): Promise<Specialty> {
        const saved = await this.prisma.specialty.upsert({
            where: { id: specialty.id },
            create: SpecialtyMapper.toCreateInput(specialty),
            update: SpecialtyMapper.toUpdateInput(specialty),
        });
        return SpecialtyMapper.toDomain(saved);
    }

    async findById(id: string): Promise<Specialty | null> {
        const found = await this.prisma.specialty.findUnique({
            where: { id },
        });
        return found ? SpecialtyMapper.toDomain(found) : null;
    }

    async findBySlug(slug: string): Promise<Specialty | null> {
        const found = await this.prisma.specialty.findUnique({
            where: { slug },
        });
        return found ? SpecialtyMapper.toDomain(found) : null;
    }

    async findActive(): Promise<Specialty[]> {
        const items = await this.prisma.specialty.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return items.map(SpecialtyMapper.toDomain);
    }

    async findAll(): Promise<Specialty[]> {
        const items = await this.prisma.specialty.findMany({
            orderBy: { name: 'asc' },
        });
        return items.map(SpecialtyMapper.toDomain);
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.specialty.delete({
                where: { id },
            });
            return true;
        } catch {
            return false;
        }
    }
}
