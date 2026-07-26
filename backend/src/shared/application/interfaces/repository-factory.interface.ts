import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";

export const REPOSITORY_FACTORY_INTERFACE = Symbol('RepositoryFactoryInterface');

export interface RepositoryFactoryInterface {
    createUserRepository(): UserRepositoryPort;
}
