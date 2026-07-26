import { DISTRIBUTED_LOCK_SERVICE_INTERFACE } from "@/shared/application/interfaces/distributed-lock.service.interface";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisLockFacade } from "./redis-lock.facade";

//By default, is a Global Module
@Module({
    imports: [
        RedisModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: unknown) => {
                const cs = configService as ConfigService;
                return {
                    config: {
                        host: (cs.get('REDIS_HOST') as string) || 'redis',
                        port: Number(cs.get('REDIS_PORT')) || 6379,
                        password: (cs.get('REDIS_PASSWORD') as string) || '',
                        maxRetriesPerRequest: 3,
                    }
                };
            }
        })
    ],
    providers: [
        {
            provide: DISTRIBUTED_LOCK_SERVICE_INTERFACE,
            useClass: RedisLockFacade,
        }
    ],
    exports: [DISTRIBUTED_LOCK_SERVICE_INTERFACE]
})

export class RedisLockModule { }