import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetSpecialtiesQuery } from '../queries/get-specialties.query';
import { SpecialtyQueryServicePort } from '../ports/specialty-query.service.port';
import { SpecialtyResDto } from '../dtos/specialty.res.dto';

@Injectable()
@QueryHandler(GetSpecialtiesQuery)
export class GetSpecialtiesHandler implements IQueryHandler<GetSpecialtiesQuery> {
    constructor(
        private readonly specialtyQueryService: SpecialtyQueryServicePort,
    ) {}

    async execute(query: GetSpecialtiesQuery): Promise<SpecialtyResDto[]> {
        return query.includeInactive
            ? await this.specialtyQueryService.findAllSpecialties()
            : await this.specialtyQueryService.findActiveSpecialties();
    }
}
