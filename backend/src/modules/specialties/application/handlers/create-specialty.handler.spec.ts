import { ConflictException } from '@nestjs/common';
import { CreateSpecialtyHandler } from './create-specialty.handler';
import { CreateSpecialtyCommand } from '../commands/create-specialty.command';
import { SpecialtyRepositoryPort } from '../../domain/ports/specialty.repository.port';
import { SpecialtyQueryServicePort } from '../ports/specialty-query.service.port';
import { Specialty } from '../../domain/entities/specialty.entity';

describe('CreateSpecialtyHandler', () => {
    let handler: CreateSpecialtyHandler;
    let repositoryMock: jest.Mocked<SpecialtyRepositoryPort>;
    let queryServiceMock: jest.Mocked<SpecialtyQueryServicePort>;

    beforeEach(() => {
        repositoryMock = {
            create: jest.fn(),
            createMany: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findActive: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
        };
        queryServiceMock = {
            findActiveSpecialties: jest.fn(),
            findAllSpecialties: jest.fn(),
            invalidateCache: jest.fn(),
        };
        handler = new CreateSpecialtyHandler(repositoryMock, queryServiceMock);
    });

    it('should create a new specialty, invalidate cache, and return entity', async () => {
        const command = new CreateSpecialtyCommand('Dermatology', undefined, 'Skin care');

        repositoryMock.findBySlug.mockResolvedValue(null);
        repositoryMock.findAll.mockResolvedValue([]);
        const createdSpecialty = Specialty.create({ name: 'Dermatology', description: 'Skin care' });
        repositoryMock.save.mockResolvedValue(createdSpecialty);

        const result = await handler.execute(command);

        expect(repositoryMock.findBySlug).toHaveBeenCalledWith('dermatology');
        expect(repositoryMock.save).toHaveBeenCalled();
        expect(queryServiceMock.invalidateCache).toHaveBeenCalled();
        expect(result.name).toBe('Dermatology');
        expect(result.slug).toBe('dermatology');
    });

    it('should throw ConflictException if slug or name already exists', async () => {
        const command = new CreateSpecialtyCommand('Dermatology', 'dermatology');

        const existing = Specialty.create({ name: 'Dermatology', slug: 'dermatology' });
        repositoryMock.findBySlug.mockResolvedValue(existing);
        repositoryMock.findAll.mockResolvedValue([existing]);

        await expect(handler.execute(command)).rejects.toThrow(ConflictException);
        expect(repositoryMock.save).not.toHaveBeenCalled();
        expect(queryServiceMock.invalidateCache).not.toHaveBeenCalled();
    });
});
