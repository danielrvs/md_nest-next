import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateSpecialtyCommand } from '../commands/update-specialty.command';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { SpecialtyQueryServicePort } from '../ports/specialty-query.service.port';
import { Specialty } from '../../domain/entities/specialty.entity';

@Injectable()
@CommandHandler(UpdateSpecialtyCommand)
export class UpdateSpecialtyHandler implements ICommandHandler<UpdateSpecialtyCommand> {
    constructor(
        private readonly specialtyRepository: SpecialtyRepositoryPort,
        private readonly specialtyQueryService: SpecialtyQueryServicePort,
    ) {}

    async execute(command: UpdateSpecialtyCommand): Promise<Specialty> {
        const specialty = await this.findSpecialtyOrThrow(command.id);

        await this.validateUniqueSlugIfChanged(command, specialty);

        specialty.update({
            name: command.name,
            slug: command.slug,
            description: command.description,
            icon: command.icon,
            image: command.image,
        });

        this.applyActiveStatusChange(specialty, command.isActive);

        const saved = await this.specialtyRepository.save(specialty);
        await this.specialtyQueryService.invalidateCache();
        return saved;
    }

    private async findSpecialtyOrThrow(id: string): Promise<Specialty> {
        const specialty = await this.specialtyRepository.findById(id);
        if (!specialty) {
            throw new NotFoundException('Specialty not found');
        }
        return specialty;
    }

    private async validateUniqueSlugIfChanged(
        command: UpdateSpecialtyCommand,
        currentSpecialty: Specialty,
    ): Promise<void> {
        if (!command.name && !command.slug) return;

        const targetSlug = command.slug ?? (command.name ? Specialty.slugify(command.name) : currentSpecialty.slug);
        if (targetSlug !== currentSpecialty.slug) {
            const existing = await this.specialtyRepository.findBySlug(targetSlug);
            if (existing) {
                throw new ConflictException(`Specialty with slug '${targetSlug}' already exists`);
            }
        }
    }

    private applyActiveStatusChange(specialty: Specialty, isActive?: boolean): void {
        if (isActive === undefined) return;
        if (isActive) {
            specialty.activate();
        } else {
            specialty.deactivate();
        }
    }
}
