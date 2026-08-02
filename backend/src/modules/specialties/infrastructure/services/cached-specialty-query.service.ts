import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SpecialtyQueryServicePort } from '../../application/ports/specialty-query.service.port';
import { SpecialtyResDto } from '../../application/dtos/specialty.res.dto';

export const PRIMARY_SPECIALTY_QUERY_SERVICE = Symbol('PRIMARY_SPECIALTY_QUERY_SERVICE');

@Injectable()
export class CachedSpecialtyQueryService implements SpecialtyQueryServicePort {
    private static readonly ACTIVE_SPECIALTIES_CACHE_KEY = 'specialties:active';

    constructor(
        @Inject(PRIMARY_SPECIALTY_QUERY_SERVICE)
        private readonly target: SpecialtyQueryServicePort,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    async findActiveSpecialties(): Promise<SpecialtyResDto[]> {
        const cached = await this.cacheManager.get<SpecialtyResDto[]>(
            CachedSpecialtyQueryService.ACTIVE_SPECIALTIES_CACHE_KEY,
        );

        if (cached) {
            return cached;
        }

        const items = await this.target.findActiveSpecialties();
        await this.cacheManager.set(
            CachedSpecialtyQueryService.ACTIVE_SPECIALTIES_CACHE_KEY,
            items,
            60000,
        );
        return items;
    }

    async findAllSpecialties(): Promise<SpecialtyResDto[]> {
        return await this.target.findAllSpecialties();
    }

    async invalidateCache(): Promise<void> {
        await this.cacheManager.del(CachedSpecialtyQueryService.ACTIVE_SPECIALTIES_CACHE_KEY);
    }
}
