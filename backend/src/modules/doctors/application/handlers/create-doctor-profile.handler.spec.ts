import { ConflictException } from '@nestjs/common';
import { CreateDoctorProfileHandler } from './create-doctor-profile.handler';
import { CreateDoctorProfileCommand } from '../commands/create-doctor-profile.command';
import { DoctorProfileRepositoryPort } from '../../domain/ports/doctor-profile.repository.port';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

describe('CreateDoctorProfileHandler', () => {
    let handler: CreateDoctorProfileHandler;
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
        handler = new CreateDoctorProfileHandler(repositoryMock);
    });

    it('should create and return a new unverified doctor profile', async () => {
        const command = new CreateDoctorProfileCommand(
            'user-id-123',
            'MED-100200',
            'Cardiologist bio',
            200,
            ['spec-1'],
            'https://avatar.url',
        );

        repositoryMock.findByUserId.mockResolvedValue(null);
        repositoryMock.findByLicenseNumber.mockResolvedValue(null);

        const expectedProfile = new DoctorProfile(
            'profile-id-1',
            command.userId,
            command.licenseNumber,
            command.bio,
            command.consultationFee,
            false,
            command.avatar,
        );

        repositoryMock.save.mockResolvedValue(expectedProfile);

        const result = await handler.execute(command);

        expect(repositoryMock.findByUserId).toHaveBeenCalledWith('user-id-123');
        expect(repositoryMock.findByLicenseNumber).toHaveBeenCalledWith('MED-100200');
        expect(repositoryMock.save).toHaveBeenCalled();
        expect(result.isVerified).toBe(false);
        expect(result.licenseNumber).toBe('MED-100200');
    });

    it('should throw ConflictException when doctor profile already exists for user', async () => {
        const command = new CreateDoctorProfileCommand(
            'user-id-123',
            'MED-100200',
        );

        const existingProfile = new DoctorProfile('existing-id', 'user-id-123', 'MED-999');
        repositoryMock.findByUserId.mockResolvedValue(existingProfile);
        repositoryMock.findByLicenseNumber.mockResolvedValue(null);

        await expect(handler.execute(command)).rejects.toThrow(ConflictException);
        expect(repositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when license number is already registered', async () => {
        const command = new CreateDoctorProfileCommand(
            'user-id-123',
            'MED-100200',
        );

        repositoryMock.findByUserId.mockResolvedValue(null);
        const existingLicenseProfile = new DoctorProfile('other-id', 'other-user', 'MED-100200');
        repositoryMock.findByLicenseNumber.mockResolvedValue(existingLicenseProfile);

        await expect(handler.execute(command)).rejects.toThrow(ConflictException);
        expect(repositoryMock.save).not.toHaveBeenCalled();
    });
});
