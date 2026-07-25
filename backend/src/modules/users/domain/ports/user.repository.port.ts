import { IsFactoryRepository } from "@/shared/domain/interfaces/is-factory.repository.interface";
import { User } from "../entities/user.entity";

export abstract class UserRepositoryPort implements IsFactoryRepository<User> {
    abstract create(entity: User): Promise<User>;
    abstract createMany(entities: User[]): Promise<{ count: number }>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findById(id: string): Promise<User | null>;
    abstract update(id: string, data: User): Promise<User>;
    abstract delete(id: string): Promise<void>;
}