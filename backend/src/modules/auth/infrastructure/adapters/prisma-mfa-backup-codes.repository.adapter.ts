import { PrismaBaseRepository } from "@/shared/infrastructure/adapters/prisma-base.repository";
import { MfaBackupCodesRepositoryPort } from "../../domain/ports/mfa-backup-codes.repository.port";
import { Injectable } from "@nestjs/common";
import { MfaBackupCodes } from "../../domain/entities/mfa-backup-codes.entity";
import { MfaBackupCodesMapper } from "../mappers/mfa-backup-codes.mapper";
import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";

@Injectable()
export class PrismaMfaBackupCodesRepository extends PrismaBaseRepository implements MfaBackupCodesRepositoryPort {

    constructor(public readonly prisma: PrismaService) { super() }

    async create(data: MfaBackupCodes): Promise<MfaBackupCodes> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.mfaBackupCodes.create({
                data: MfaBackupCodesMapper.toCreateInput(data)
            });
            return MfaBackupCodesMapper.toDomain(result);
        })
    }

    async createMany(data: MfaBackupCodes[]): Promise<{ count: number }> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.mfaBackupCodes.createMany({
                data: data.map(MfaBackupCodesMapper.toCreateManyInput)
            });
            return result;
        })
    }

    async findByCode(code: string): Promise<MfaBackupCodes | null> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.mfaBackupCodes.findUnique({
                where: {
                    code: code
                }
            });
            return result ? MfaBackupCodesMapper.toDomain(result) : null;
        })
    }

    async findByUserId(userId: string): Promise<MfaBackupCodes[] | null> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.mfaBackupCodes.findMany({
                where: {
                    userId: userId
                }
            });
            return result.map(MfaBackupCodesMapper.toDomain);
        })
    }

    async delete(id: string): Promise<void> {
        await this.handleDbOperation(async () => {
            await this.prisma.mfaBackupCodes.delete({
                where: {
                    id: id
                }
            });
        });
    }

    async update(id: string, data: Partial<MfaBackupCodes>): Promise<MfaBackupCodes> {
        return await this.handleDbOperation(async () => {
            const result = await this.prisma.mfaBackupCodes.update({
                where: {
                    id: id
                },
                data: MfaBackupCodesMapper.toUpdateInput(data)
            });
            return MfaBackupCodesMapper.toDomain(result);
        })
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.handleDbOperation(async () => {
            await this.prisma.mfaBackupCodes.deleteMany({
                where: {
                    userId: userId
                }
            });
        });
    }
}