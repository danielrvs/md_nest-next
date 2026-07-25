import { IsFactoryRepository } from "@/shared/domain/interfaces/is-factory.repository.interface";

export abstract class BaseFactory<T, R> {
    protected overrides: T = {} as T;

    constructor(protected readonly repository: IsFactoryRepository<R>) { }

    protected abstract createEntity(): Promise<R>
    protected abstract defaultDefinition(): Promise<Required<T>>

    state(overrides: Partial<T>): this {
        this.overrides = { ...this.overrides, ...overrides };
        return this;
    }

    async make(): Promise<R> {
        return await this.createEntity()
    }

    async makeMany(quantity: number): Promise<R[]> {
        const entities: R[] = [];
        for (let i = 0; i < quantity; i++) {
            entities.push(await this.createEntity())
        }
        return entities
    }

    async create(): Promise<R> {
        const entity = await this.make();
        return await this.repository.create(entity);
    }

    async createMany(quantity: number): Promise<R[]> {
        const entities = await this.makeMany(quantity);
        await this.repository.createMany(entities);
        return entities;
    }




}