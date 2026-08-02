import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { DoctorProfileRepositoryPort } from "@/modules/doctors/domain/ports/doctor-profile.repository.port";
import { SpecialtyRepositoryPort } from "@/modules/specialties/domain/ports/specialty.repository.port";
import { INestApplication } from "@nestjs/common";
import { UserFactoryBuilder } from "./user/user.factory";
import { DoctorProfileFactoryBuilder } from "./doctor/doctor-profile.factory";
import { SpecialtyFactoryBuilder } from "./specialty/specialty.factory";
import { TokenGeneratorPort } from "@/modules/auth/domain/ports/token-generator.port";

export class TestFactories {
    private static app: INestApplication;

    private static userRepository: UserRepositoryPort | null = null;
    private static doctorProfileRepository: DoctorProfileRepositoryPort | null = null;
    private static specialtyRepository: SpecialtyRepositoryPort | null = null;

    static init(app: INestApplication): typeof TestFactories {
        this.app = app;

        this.userRepository = app.get(UserRepositoryPort);
        this.doctorProfileRepository = app.get(DoctorProfileRepositoryPort);
        this.specialtyRepository = app.get(SpecialtyRepositoryPort);

        return this;
    }

    static user(): UserFactoryBuilder {
        if (!this.userRepository) {
            throw new Error('TestFactories not initialized');
        }

        return new UserFactoryBuilder(this.userRepository, this.app.get(TokenGeneratorPort));
    }

    static doctorProfile(): DoctorProfileFactoryBuilder {
        if (!this.doctorProfileRepository) {
            throw new Error('TestFactories not initialized');
        }

        return new DoctorProfileFactoryBuilder(this.doctorProfileRepository);
    }

    static specialty(): SpecialtyFactoryBuilder {
        if (!this.specialtyRepository) {
            throw new Error('TestFactories not initialized');
        }

        return new SpecialtyFactoryBuilder(this.specialtyRepository);
    }
}