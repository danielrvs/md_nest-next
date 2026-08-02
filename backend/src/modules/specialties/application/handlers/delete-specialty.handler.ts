import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteSpecialtyCommand } from '../commands/delete-specialty.command';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { SpecialtyQueryServicePort } from '../ports/specialty-query.service.port';

@Injectable()
@CommandHandler(DeleteSpecialtyCommand)
export class DeleteSpecialtyHandler implements ICommandHandler<DeleteSpecialtyCommand> {
    constructor(
        private readonly specialtyRepository: SpecialtyRepositoryPort,
        private readonly specialtyQueryService: SpecialtyQueryServicePort,
    ) {}

    async execute(command: DeleteSpecialtyCommand): Promise<boolean> {
        const specialty = await this.specialtyRepository.findById(command.id);
        if (!specialty) {
            throw new NotFoundException('Specialty not found');
        }

        const deleted = await this.specialtyRepository.delete(command.id);
        if (deleted) {
            await this.specialtyQueryService.invalidateCache();
        }
        return deleted;
    }
}
