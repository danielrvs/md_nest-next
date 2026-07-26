import { RepositoryFactoryInterface } from "./repository-factory.interface";

export const UNIT_OF_WORK_INTERFACE = Symbol('UnitOfWorkInterface');

export interface UnitOfWorkInterface {
    execute<T>(operation: (repositoryFactory: RepositoryFactoryInterface) => Promise<T>): Promise<T>;
}
