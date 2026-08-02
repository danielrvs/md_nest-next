import { DoctorProfile as PrismaDoctorProfile, Specialty as PrismaSpecialty, User as PrismaUser, Prisma } from 'generated/prisma/client';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';
import { Specialty } from '@/modules/specialties/domain/entities/specialty.entity';
import { Email } from '@/modules/users/domain/entities/vo/email.vo';

export type PrismaDoctorProfileWithRelations = PrismaDoctorProfile & {
    specialties?: { specialty: PrismaSpecialty }[];
    doctor?: PrismaUser;
};

export class DoctorProfileMapper {
    static toDomain(prismaObj: PrismaDoctorProfileWithRelations): DoctorProfile {
        const specialties = (prismaObj.specialties || []).map(
            (s) =>
                new Specialty(
                    s.specialty.id,
                    s.specialty.name,
                    s.specialty.slug,
                    s.specialty.description,
                    s.specialty.icon,
                    s.specialty.image,
                    s.specialty.isActive,
                    s.specialty.createdAt,
                    s.specialty.updatedAt,
                ),
        );

        return new DoctorProfile(
            prismaObj.id,
            prismaObj.userId,
            prismaObj.licenseNumber,
            prismaObj.bio,
            prismaObj.consultationFee ? Number(prismaObj.consultationFee) : null,
            prismaObj.isVerified,
            prismaObj.avatar,
            specialties,
            prismaObj.doctor ? prismaObj.doctor.name : null,
            prismaObj.doctor ? Email.create(prismaObj.doctor.email) : null,
            prismaObj.createdAt,
            prismaObj.updatedAt,
        );
    }

    static toCreateInput(profile: DoctorProfile, specialtyIds?: string[]): Prisma.DoctorProfileCreateInput {
        return {
            id: profile.id,
            doctor: {
                connect: { id: profile.userId },
            },
            licenseNumber: profile.licenseNumber,
            bio: profile.bio ?? null,
            consultationFee: profile.consultationFee ?? null,
            isVerified: profile.isVerified,
            avatar: profile.avatar ?? null,
            specialties: specialtyIds && specialtyIds.length > 0
                ? {
                      create: specialtyIds.map((specialtyId) => ({
                          specialtyId,
                      })),
                  }
                : undefined,
        };
    }

    static toUpdateInput(profile: DoctorProfile, specialtyIds?: string[]): Prisma.DoctorProfileUpdateInput {
        return {
            licenseNumber: profile.licenseNumber,
            bio: profile.bio ?? null,
            consultationFee: profile.consultationFee ?? null,
            isVerified: profile.isVerified,
            avatar: profile.avatar ?? null,
            specialties: specialtyIds
                ? {
                      deleteMany: {},
                      create: specialtyIds.map((specialtyId) => ({
                          specialtyId,
                      })),
                  }
                : undefined,
        };
    }
}
