import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SpecialtiesController } from './infrastructure/http/specialties.controller';
import { SpecialtyRepositoryPort } from './domain/ports/specialty.repository.port';
import { PrismaSpecialtyRepository } from './infrastructure/adapters/prisma-specialty.repository';
import { SpecialtyQueryServicePort } from './application/ports/specialty-query.service.port';
import { PrismaSpecialtyQueryService } from './infrastructure/services/prisma-specialty-query.service';
import { CachedSpecialtyQueryService, PRIMARY_SPECIALTY_QUERY_SERVICE } from './infrastructure/services/cached-specialty-query.service';

import { CreateSpecialtyHandler } from './application/handlers/create-specialty.handler';
import { UpdateSpecialtyHandler } from './application/handlers/update-specialty.handler';
import { DeleteSpecialtyHandler } from './application/handlers/delete-specialty.handler';
import { GetSpecialtiesHandler } from './application/handlers/get-specialties.handler';
import { GetSpecialtyByIdHandler } from './application/handlers/get-specialty-by-id.handler';

const CommandHandlers = [
    CreateSpecialtyHandler,
    UpdateSpecialtyHandler,
    DeleteSpecialtyHandler,
];

const QueryHandlers = [
    GetSpecialtiesHandler,
    GetSpecialtyByIdHandler,
];

@Module({
    imports: [CqrsModule],
    controllers: [SpecialtiesController],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        {
            provide: SpecialtyRepositoryPort,
            useClass: PrismaSpecialtyRepository,
        },
        {
            provide: PRIMARY_SPECIALTY_QUERY_SERVICE,
            useClass: PrismaSpecialtyQueryService,
        },
        {
            provide: SpecialtyQueryServicePort,
            useClass: CachedSpecialtyQueryService,
        },
    ],
    exports: [
        SpecialtyRepositoryPort,
        SpecialtyQueryServicePort,
    ],
})
export class SpecialtiesModule {}
