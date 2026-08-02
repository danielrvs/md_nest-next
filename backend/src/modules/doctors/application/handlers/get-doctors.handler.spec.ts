import { GetDoctorsHandler } from './get-doctors.handler';
import { GetDoctorsQuery } from '../queries/get-doctors.query';
import { DoctorQueryServicePort } from '../ports/doctor-query.service.port';
import { DoctorListResDto } from '../dtos/doctor-list.res.dto';

describe('GetDoctorsHandler', () => {
    let handler: GetDoctorsHandler;
    let queryServiceMock: jest.Mocked<DoctorQueryServicePort>;

    beforeEach(() => {
        queryServiceMock = {
            findVerifiedDoctors: jest.fn(),
        };
        handler = new GetDoctorsHandler(queryServiceMock);
    });

    it('should delegate query execution to DoctorQueryServicePort and return DoctorListResDto', async () => {
        const query = new GetDoctorsQuery('spec-1', 1, 10);
        const mockResult: DoctorListResDto = {
            items: [],
            total: 0,
            page: 1,
            perPage: 10,
        };

        queryServiceMock.findVerifiedDoctors.mockResolvedValue(mockResult);

        const result = await handler.execute(query);

        expect(queryServiceMock.findVerifiedDoctors).toHaveBeenCalledWith({
            specialtyId: 'spec-1',
            page: 1,
            perPage: 10,
        });
        expect(result).toEqual(mockResult);
    });
});
