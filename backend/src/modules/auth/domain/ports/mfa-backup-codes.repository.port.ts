import { IsFactoryRepository } from "@/shared/domain/interfaces/is-factory.repository.interface";
import { MfaBackupCodes } from "../entities/mfa-backup-codes.entity";

export abstract class MfaBackupCodesRepositoryPort implements IsFactoryRepository<MfaBackupCodes> {
    abstract create(data: MfaBackupCodes): Promise<MfaBackupCodes>;
    abstract createMany(data: MfaBackupCodes[]): Promise<{ count: number }>;
    abstract findByCode(code: string): Promise<MfaBackupCodes | null>;
    abstract findByUserId(userId: string): Promise<MfaBackupCodes[] | null>;
    abstract delete(id: string): Promise<void>;
    abstract update(id: string, data: Partial<MfaBackupCodes>): Promise<MfaBackupCodes>;
    abstract deleteByUserId(userId: string): Promise<void>;
}