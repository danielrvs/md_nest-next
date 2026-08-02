import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateDoctorProfileCommand } from '../commands/create-doctor-profile.command';
import { DoctorProfileRepositoryPort } from '../../domain/ports/doctor-profile.repository.port';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

@Injectable()
@CommandHandler(CreateDoctorProfileCommand)
export class CreateDoctorProfileHandler implements ICommandHandler<CreateDoctorProfileCommand> {
    constructor(
        private readonly doctorProfileRepository: DoctorProfileRepositoryPort,
    ) {}

    async execute(command: CreateDoctorProfileCommand): Promise<DoctorProfile> {
        await Promise.all([
            this.ensureUserHasNoExistingProfile(command.userId),
            this.ensureLicenseIsUnique(command.licenseNumber),
        ]);

        const profile = DoctorProfile.create({
            userId: command.userId,
            licenseNumber: command.licenseNumber,
            bio: command.bio,
            consultationFee: command.consultationFee,
            avatar: command.avatar,
        });

        return await this.doctorProfileRepository.save(profile, command.specialtyIds);
    }

    private async ensureUserHasNoExistingProfile(userId: string): Promise<void> {
        const existing = await this.doctorProfileRepository.findByUserId(userId);
        if (existing) {
            throw new ConflictException('Doctor profile already exists for this user');
        }
    }

    private async ensureLicenseIsUnique(licenseNumber: string): Promise<void> {
        const existing = await this.doctorProfileRepository.findByLicenseNumber(licenseNumber);
        if (existing) {
            throw new ConflictException('License number is already in use');
        }
    }
}
