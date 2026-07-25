import { UserRepositoryPort } from "@/modules/users/domain/ports/user.repository.port";
import { INestApplication } from "@nestjs/common";
import { UserFactoryBuilder } from "./user/user.factory";
import { TokenGeneratorPort } from "@/modules/auth/domain/ports/token-generator.port";

export class TestFactories {
    private static app: INestApplication;

    private static userRepository: UserRepositoryPort | null = null;

    static init(app: INestApplication): typeof TestFactories {
        this.app = app;

        this.userRepository = app.get(UserRepositoryPort);

        return this;
    }

    static user(): UserFactoryBuilder {
        if (!this.userRepository) {
            throw new Error('TestFactories not initialized');
        }

        return new UserFactoryBuilder(this.userRepository, this.app.get(TokenGeneratorPort));
    }
}