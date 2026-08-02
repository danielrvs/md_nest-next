import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetSpecialtiesQuery } from '@/modules/specialties/application/queries/get-specialties.query';
import { SpecialtyRepositoryPort } from '@/modules/specialties/domain/ports/specialty.repository.port';
import { SpecialtyResDto } from '@/modules/specialties/application/dtos/specialty.res.dto';


@Injectable()
@QueryHandler(GetSpecialtiesQuery)
export class GetSpecialtiesHandler implements IQueryHandler<GetSpecialtiesQuery> {
    constructor(
        private readonly specialtyRepository: SpecialtyRepositoryPort,
    ) {}

    async execute(query: GetSpecialtiesQuery): Promise<SpecialtyResDto[]> {
        const items = query.includeInactive
            ? await this.specialtyRepository.findAll()
            : await this.specialtyRepository.findActive();

        return items.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description ?? undefined,
            icon: item.icon ?? undefined,
            image: item.image ?? undefined,
            isActive: item.isActive,
        }));
    }
}
