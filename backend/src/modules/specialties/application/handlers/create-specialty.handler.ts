import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSpecialtyCommand } from '../commands/create-specialty.command';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { SpecialtyQueryServicePort } from '../ports/specialty-query.service.port';
import { Specialty } from '../../domain/entities/specialty.entity';

@Injectable()
@CommandHandler(CreateSpecialtyCommand)
export class CreateSpecialtyHandler implements ICommandHandler<CreateSpecialtyCommand> {
    constructor(
        private readonly specialtyRepository: SpecialtyRepositoryPort,
        private readonly specialtyQueryService: SpecialtyQueryServicePort,
    ) {}

    async execute(command: CreateSpecialtyCommand): Promise<Specialty> {
        const targetSlug = command.slug ?? Specialty.slugify(command.name);

        await Promise.all([
            this.ensureNameIsUnique(command.name),
            this.ensureSlugIsUnique(targetSlug),
        ]);

        const specialty = Specialty.create({
            name: command.name,
            slug: command.slug,
            description: command.description,
            icon: command.icon,
            image: command.image,
        });

        const saved = await this.specialtyRepository.save(specialty);
        await this.specialtyQueryService.invalidateCache();
        return saved;
    }

    private async ensureNameIsUnique(name: string): Promise<void> {
        const allItems = await this.specialtyRepository.findAll();
        const existingByName = allItems.find(
            (item) => item.name.toLowerCase() === name.toLowerCase(),
        );
        if (existingByName) {
            throw new ConflictException(`Specialty with name '${name}' already exists`);
        }
    }

    private async ensureSlugIsUnique(slug: string): Promise<void> {
        const existingBySlug = await this.specialtyRepository.findBySlug(slug);
        if (existingBySlug) {
            throw new ConflictException(`Specialty with slug '${slug}' already exists`);
        }
    }
}
