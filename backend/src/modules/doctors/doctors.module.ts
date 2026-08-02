import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DoctorsController } from './infrastructure/http/doctors.controller';
import { DoctorProfileRepositoryPort } from './domain/ports/doctor-profile.repository.port';
import { PrismaDoctorProfileRepository } from './infrastructure/adapters/prisma-doctor-profile.repository';
import { DoctorQueryServicePort } from './application/ports/doctor-query.service.port';
import { PrismaDoctorQueryService } from './infrastructure/services/prisma-doctor-query.service';

import { CreateDoctorProfileHandler } from './application/handlers/create-doctor-profile.handler';
import { GetDoctorsHandler } from './application/handlers/get-doctors.handler';
import { VerifyDoctorProfileHandler } from './application/handlers/verify-doctor-profile.handler';

const CommandHandlers = [
    CreateDoctorProfileHandler,
    VerifyDoctorProfileHandler,
];

const QueryHandlers = [
    GetDoctorsHandler,
];

@Module({
    imports: [CqrsModule],
    controllers: [DoctorsController],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        {
            provide: DoctorProfileRepositoryPort,
            useClass: PrismaDoctorProfileRepository,
        },
        {
            provide: DoctorQueryServicePort,
            useClass: PrismaDoctorQueryService,
        },
    ],
    exports: [
        DoctorProfileRepositoryPort,
        DoctorQueryServicePort,
    ],
})
export class DoctorsModule {}
