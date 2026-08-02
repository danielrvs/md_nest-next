import { NotFoundException } from '@nestjs/common';
import { VerifyDoctorProfileHandler } from './verify-doctor-profile.handler';
import { VerifyDoctorProfileCommand } from '../commands/verify-doctor-profile.command';
import { DoctorProfileRepositoryPort } from '../../domain/ports/doctor-profile.repository.port';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

describe('VerifyDoctorProfileHandler', () => {
    let handler: VerifyDoctorProfileHandler;
    let repositoryMock: jest.Mocked<DoctorProfileRepositoryPort>;

    beforeEach(() => {
        repositoryMock = {
            create: jest.fn(),
            createMany: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            findByLicenseNumber: jest.fn(),
        };
        handler = new VerifyDoctorProfileHandler(repositoryMock);
    });

    it('should load aggregate root, execute profile.verify(), and save updated entity', async () => {
        const command = new VerifyDoctorProfileCommand('profile-id-1', true);
        const unverifiedProfile = new DoctorProfile('profile-id-1', 'user-1', 'MED-1', 'bio', 100, false);

        repositoryMock.findById.mockResolvedValue(unverifiedProfile);
        repositoryMock.save.mockImplementation(async (profile) => profile);

        const result = await handler.execute(command);

        expect(repositoryMock.findById).toHaveBeenCalledWith('profile-id-1');
        expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ isVerified: true }));
        expect(result.isVerified).toBe(true);
    });

    it('should throw NotFoundException if doctor profile does not exist', async () => {
        const command = new VerifyDoctorProfileCommand('non-existent-id', true);
        repositoryMock.findById.mockResolvedValue(null);

        await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
        expect(repositoryMock.save).not.toHaveBeenCalled();
    });
});
