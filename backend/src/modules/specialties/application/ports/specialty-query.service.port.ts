import { SpecialtyResDto } from '../dtos/specialty.res.dto';

/**
 * Port contract for Specialty read-side query operations.
 */
export abstract class SpecialtyQueryServicePort {
    abstract findActiveSpecialties(): Promise<SpecialtyResDto[]>;
    abstract findAllSpecialties(): Promise<SpecialtyResDto[]>;
    abstract invalidateCache(): Promise<void>;
}
