import { Specialty as PrismaSpecialty, Prisma } from 'generated/prisma/client';
import { Specialty } from '../../domain/entities/specialty.entity';

export class SpecialtyMapper {
    static toDomain(prismaObj: PrismaSpecialty): Specialty {
        return new Specialty(
            prismaObj.id,
            prismaObj.name,
            prismaObj.slug,
            prismaObj.description,
            prismaObj.icon,
            prismaObj.image,
            prismaObj.isActive,
            prismaObj.createdAt,
            prismaObj.updatedAt,
        );
    }

    static toCreateInput(specialty: Specialty): Prisma.SpecialtyCreateInput {
        return {
            id: specialty.id,
            name: specialty.name,
            slug: specialty.slug,
            description: specialty.description ?? null,
            icon: specialty.icon ?? null,
            image: specialty.image ?? null,
            isActive: specialty.isActive,
        };
    }

    static toUpdateInput(specialty: Specialty): Prisma.SpecialtyUpdateInput {
        return {
            name: specialty.name,
            slug: specialty.slug,
            description: specialty.description ?? null,
            icon: specialty.icon ?? null,
            image: specialty.image ?? null,
            isActive: specialty.isActive,
        };
    }
}
