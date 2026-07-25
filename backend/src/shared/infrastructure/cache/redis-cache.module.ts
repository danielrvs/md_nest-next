import { createKeyv } from "@keyv/redis";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const redisHost = configService.get<string>('REDIS_HOST', 'redis');
                const redisPort = configService.get<number>('REDIS_PORT', 6379);
                const redisPassword = configService.get<string>('REDIS_PASSWORD', '');

                const authString = redisPassword ? `:${redisPassword}@` : '';
                const redisUrl = `redis://${authString}${redisHost}:${redisPort}`;

                return {
                    stores: [
                        createKeyv({
                            url: redisUrl,
                            socket: {
                                reconnectStrategy: (retries: number) => {
                                    return Math.min(retries * 100, 2000);
                                }
                            }
                        })
                    ],
                    ttl: 60 * 1000
                }
            }
        })
    ],
    exports: [CacheModule]
})

export class RedisCacheModule { }