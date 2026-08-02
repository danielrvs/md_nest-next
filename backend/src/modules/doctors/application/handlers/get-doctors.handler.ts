import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetDoctorsQuery } from '../queries/get-doctors.query';
import { DoctorQueryServicePort } from '../ports/doctor-query.service.port';
import { DoctorListResDto } from '../dtos/doctor-list.res.dto';

@Injectable()
@QueryHandler(GetDoctorsQuery)
export class GetDoctorsHandler implements IQueryHandler<GetDoctorsQuery> {
    constructor(
        private readonly doctorQueryService: DoctorQueryServicePort,
    ) {}

    async execute(query: GetDoctorsQuery): Promise<DoctorListResDto> {
        return await this.doctorQueryService.findVerifiedDoctors({
            specialtyId: query.specialtyId,
            page: query.page,
            perPage: query.perPage,
        });
    }
}
