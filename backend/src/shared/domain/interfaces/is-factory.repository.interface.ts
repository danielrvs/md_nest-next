export interface IsFactoryRepository<T> {
    create(entity: T): Promise<T>;
    createMany(entities: T[]): Promise<{ count: number }>;
}