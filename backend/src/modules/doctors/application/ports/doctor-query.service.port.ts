import { DoctorListResDto } from '../dtos/doctor-list.res.dto';

/**
 * Port contract for Doctor read-side Query Service operations.
 */
export abstract class DoctorQueryServicePort {
    abstract findVerifiedDoctors(params: {
        specialtyId?: string;
        page: number;
        perPage: number;
    }): Promise<DoctorListResDto>;
}
