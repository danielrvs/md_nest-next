import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetSpecialtyByIdQuery } from '../queries/get-specialty-by-id.query';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { SpecialtyResDto } from '../dtos/specialty.res.dto';

@Injectable()
@QueryHandler(GetSpecialtyByIdQuery)
export class GetSpecialtyByIdHandler implements IQueryHandler<GetSpecialtyByIdQuery> {
    constructor(
        private readonly specialtyRepository: SpecialtyRepositoryPort,
    ) {}

    async execute(query: GetSpecialtyByIdQuery): Promise<SpecialtyResDto> {
        const item = await this.specialtyRepository.findById(query.id);
        if (!item) {
            throw new NotFoundException('Specialty not found');
        }

        return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description ?? undefined,
            icon: item.icon ?? undefined,
            image: item.image ?? undefined,
            isActive: item.isActive,
        };
    }
}
