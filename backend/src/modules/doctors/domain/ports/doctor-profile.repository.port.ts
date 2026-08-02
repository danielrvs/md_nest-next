import { IsFactoryRepository } from "@/shared/domain/interfaces/is-factory.repository.interface";
import { DoctorProfile } from '../entities/doctor-profile.entity';

/**
 * Port contract for DoctorProfile repository persistence operations (Write Side).
 */
export abstract class DoctorProfileRepositoryPort implements IsFactoryRepository<DoctorProfile> {
    abstract create(entity: DoctorProfile, specialtyIds?: string[]): Promise<DoctorProfile>;
    abstract createMany(entities: DoctorProfile[]): Promise<{ count: number }>;
    abstract save(profile: DoctorProfile, specialtyIds?: string[]): Promise<DoctorProfile>;
    abstract findByUserId(userId: string): Promise<DoctorProfile | null>;
    abstract findById(id: string): Promise<DoctorProfile | null>;
    abstract findByLicenseNumber(licenseNumber: string): Promise<DoctorProfile | null>;
}
