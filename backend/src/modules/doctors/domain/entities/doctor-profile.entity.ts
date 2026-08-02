import { randomUUID } from 'crypto';
import { Specialty } from '@/modules/specialties/domain/entities/specialty.entity';
import { Email } from '@/modules/users/domain/entities/vo/email.vo';

export class DoctorProfile {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public licenseNumber: string,
        public bio?: string | null,
        public consultationFee?: number | null,
        public isVerified: boolean = false,
        public avatar?: string | null,
        public specialties: Specialty[] = [],
        public doctorName?: string | null,
        public doctorEmail?: Email | null,
        public readonly createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
    ) {}

    static create(data: {
        userId: string;
        licenseNumber: string;
        bio?: string | null;
        consultationFee?: number | null;
        avatar?: string | null;
        specialties?: Specialty[];
        id?: string;
    }): DoctorProfile {
        const now = new Date();
        return new DoctorProfile(
            data.id ?? randomUUID(),
            data.userId,
            data.licenseNumber,
            data.bio ?? null,
            data.consultationFee ?? null,
            false,
            data.avatar ?? null,
            data.specialties ?? [],
            null,
            null,
            now,
            now,
        );
    }

    public updateProfile(data: {
        licenseNumber?: string;
        bio?: string | null;
        consultationFee?: number | null;
        avatar?: string | null;
        specialties?: Specialty[];
    }): void {
        if (data.licenseNumber !== undefined) this.licenseNumber = data.licenseNumber;
        if (data.bio !== undefined) this.bio = data.bio;
        if (data.consultationFee !== undefined) this.consultationFee = data.consultationFee;
        if (data.avatar !== undefined) this.avatar = data.avatar;
        if (data.specialties !== undefined) this.specialties = data.specialties;
        this.updatedAt = new Date();
    }

    public verify(): void {
        this.isVerified = true;
        this.updatedAt = new Date();
    }

    public unverify(): void {
        this.isVerified = false;
        this.updatedAt = new Date();
    }
}
