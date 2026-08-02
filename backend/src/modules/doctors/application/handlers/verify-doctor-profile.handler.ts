import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { VerifyDoctorProfileCommand } from '../commands/verify-doctor-profile.command';
import { DoctorProfileRepositoryPort } from '../../domain/ports/doctor-profile.repository.port';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

@Injectable()
@CommandHandler(VerifyDoctorProfileCommand)
export class VerifyDoctorProfileHandler implements ICommandHandler<VerifyDoctorProfileCommand> {
    constructor(
        private readonly doctorProfileRepository: DoctorProfileRepositoryPort,
    ) {}

    async execute(command: VerifyDoctorProfileCommand): Promise<DoctorProfile> {
        const profile = await this.doctorProfileRepository.findById(command.id);
        if (!profile) {
            throw new NotFoundException('Doctor profile not found');
        }

        if (command.isVerified) {
            profile.verify();
        } else {
            profile.unverify();
        }

        return await this.doctorProfileRepository.save(profile);
    }
}
