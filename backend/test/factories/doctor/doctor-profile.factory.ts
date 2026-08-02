import { BaseFactory } from '../base.factory';
import { DoctorProfile } from '@/modules/doctors/domain/entities/doctor-profile.entity';
import { DoctorProfileRepositoryPort } from '@/modules/doctors/domain/ports/doctor-profile.repository.port';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

export type DoctorProfileStateOverride = {
    id?: string;
    userId?: string;
    licenseNumber?: string;
    bio?: string | null;
    consultationFee?: number | null;
    isVerified?: boolean;
    avatar?: string | null;
    specialtyIds?: string[];
    createdAt?: Date;
    updatedAt?: Date;
};

export class DoctorProfileFactoryBuilder extends BaseFactory<DoctorProfileStateOverride, DoctorProfile> {
    constructor(
        protected override readonly repository: DoctorProfileRepositoryPort,
    ) {
        super(repository);
    }

    protected async defaultDefinition(): Promise<Required<DoctorProfileStateOverride>> {
        return {
            id: randomUUID(),
            userId: randomUUID(),
            licenseNumber: `MED-${faker.string.numeric(6)}`,
            bio: faker.lorem.paragraph(),
            consultationFee: 150.0,
            isVerified: true,
            avatar: faker.image.avatar(),
            specialtyIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    protected async createEntity(): Promise<DoctorProfile> {
        const def = { ...(await this.defaultDefinition()), ...this.overrides };
        return new DoctorProfile(
            def.id,
            def.userId,
            def.licenseNumber,
            def.bio,
            def.consultationFee,
            def.isVerified,
            def.avatar,
            [],
            null,
            null,
            def.createdAt,
            def.updatedAt,
        );
    }

    public asVerified(): DoctorProfileFactoryBuilder {
        return this.state({ isVerified: true });
    }

    public asUnverified(): DoctorProfileFactoryBuilder {
        return this.state({ isVerified: false });
    }

    public override async create(): Promise<DoctorProfile> {
        const def = { ...(await this.defaultDefinition()), ...this.overrides };
        const profile = await this.createEntity();
        return await this.repository.save(profile, def.specialtyIds);
    }
}
