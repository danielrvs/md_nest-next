
import { DistributedLockServiceInterface } from "@/shared/application/interfaces/distributed-lock.service.interface";
import { RedisService, DEFAULT_REDIS } from "@liaoliaots/nestjs-redis";
import { ConflictException, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisLockFacade implements DistributedLockServiceInterface {

    private readonly redis: Redis;
    // to avoid delete a lock from another process, we use a random identifier for each lock
    // and we execute this script in a atomic way to release it.
    private readonly releaseScript:string = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

    constructor(
        private readonly redisService: RedisService
    ) {
        this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
    }
    async lock<T>(key: string, ttl: number, callback: () => Promise<T>): Promise<T> {
        const identifier = crypto.randomUUID();
        const lockAcquired = await this.redis.set(key, identifier, 'EX', ttl, 'NX');
        if (!lockAcquired) throw new ConflictException('The resource is already being processed.');

        try {
            return await callback();
        } finally {
            await this.redis.eval(this.releaseScript, 1, key, identifier);
        }
    }
}