import { BaseFactory } from '../base.factory';
import { Specialty } from '@/modules/specialties/domain/entities/specialty.entity';
import { SpecialtyRepositoryPort } from '@/modules/specialties/domain/ports/specialty.repository.port';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

export type SpecialtyStateOverride = {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    image?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export class SpecialtyFactoryBuilder extends BaseFactory<SpecialtyStateOverride, Specialty> {
    constructor(
        protected override readonly repository: SpecialtyRepositoryPort,
    ) {
        super(repository);
    }

    protected async defaultDefinition(): Promise<Required<SpecialtyStateOverride>> {
        const name = `${faker.person.jobArea()} ${faker.string.numeric(4)}`;
        const slug = Specialty.slugify(name);
        return {
            id: randomUUID(),
            name,
            slug,
            description: faker.lorem.sentence(),
            icon: 'heart-icon',
            image: faker.image.url(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    protected async createEntity(): Promise<Specialty> {
        const def = { ...(await this.defaultDefinition()), ...this.overrides };
        return new Specialty(
            def.id,
            def.name,
            def.slug,
            def.description,
            def.icon,
            def.image,
            def.isActive,
            def.createdAt,
            def.updatedAt,
        );
    }

    public asActive(): SpecialtyFactoryBuilder {
        return this.state({ isActive: true });
    }

    public asInactive(): SpecialtyFactoryBuilder {
        return this.state({ isActive: false });
    }

    public override async create(): Promise<Specialty> {
        const entity = await this.createEntity();
        return await this.repository.save(entity);
    }
}
