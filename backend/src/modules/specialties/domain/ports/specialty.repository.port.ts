import { IsFactoryRepository } from '@/shared/domain/interfaces/is-factory.repository.interface';
import { Specialty } from '../entities/specialty.entity';

/**
 * Port contract for Specialty repository persistence operations.
 */
export abstract class SpecialtyRepositoryPort implements IsFactoryRepository<Specialty> {
    abstract create(entity: Specialty): Promise<Specialty>;
    abstract createMany(entities: Specialty[]): Promise<{ count: number }>;
    abstract save(specialty: Specialty): Promise<Specialty>;
    abstract findById(id: string): Promise<Specialty | null>;
    abstract findBySlug(slug: string): Promise<Specialty | null>;
    abstract findActive(): Promise<Specialty[]>;
    abstract findAll(): Promise<Specialty[]>;
    abstract delete(id: string): Promise<boolean>;
}
