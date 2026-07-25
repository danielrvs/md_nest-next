import { AppModule } from "@/app.module";
import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";
import { INestApplication } from "@nestjs/common";
import { Test } from '@nestjs/testing';
import { TestFactories } from "../factories/test-factories";
import { cleanupDatabase } from "../helpers/clean-up-database.helper";
import { setupTestApp } from "../helpers/setup-test.helper";
import request from 'supertest';
import { faker } from "@faker-js/faker";
import { RefreshTokenRepositoryPort } from "@/modules/auth/domain/ports/refresh-token.repository.port";
import { RefreshToken } from "@/modules/auth/domain/entities/refresh-token.entity";

describe('Authentication Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule(
            {
                imports: [AppModule]
            }
        ).compile();

        app = moduleFixture.createNestApplication();
        setupTestApp(app);
        prisma = app.get(PrismaService);

        TestFactories.init(app);
        await app.init();
    });

    beforeEach(async () => {
        await cleanupDatabase(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    const route = () => '/auth/login';

    describe('POST /auth/login', () => {
        it('should successfully login with valid credentials when 2FA is disabled', async () => {
            const password = 'test-password';
            const user = await TestFactories.user().state({
                password
            }).create();

            const response = await request(app.getHttpServer())
                .post(route())
                .send({
                    email: user.email.toString(),
                    password,
                });

            expect(response.status).toBe(200);
            expect(response.body.data.mfaRequired).toBe(false);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should return a pre-auth token and redirect info when 2FA is enabled', async () => {
            const password = 'test-password';
            const user = await TestFactories.user().state({
                password
            }).with2FA().create();

            const response = await request(app.getHttpServer())
                .post(route())
                .send({
                    email: user.email.toString(),
                    password,
                })

            expect(response.status).toBe(202);
            expect(response.body.data.mfaRequired).toBe(true);

            expect(response.body.data.accessToken).not.toBeDefined();
            expect(response.body.data.refreshToken).not.toBeDefined();

            expect(response.body.data.mfaToken).toEqual(expect.any(String));
        });

        it('should return 401 when password or email is wrong', async () => {
            const password = 'test-password';
            const user = await TestFactories.user().state({ password }).create();
            const wrongInputs = [
                { email: user.email.toString(), password: faker.internet.password() },
                { email: faker.internet.email(), password },
            ]

            for (const input of wrongInputs) {
                const response = await request(app.getHttpServer())
                    .post(route())
                    .send(input);
                expect(response.status).toBe(401);
                expect(response.body.error).toBe('Unauthorized');
            }
        });

        it('should return 400 when request are malformed', async () => {
            const malformedRequests = [
                { password: faker.internet.password() },
                { email: faker.internet.email() },
                { email: 'invalid-email', password: faker.internet.password() },
            ]

            for (const input of malformedRequests) {
                const response = await request(app.getHttpServer())
                    .post(route())
                    .send(input);
                expect(response.status).toBe(400);
            }
        });

        it('should enforce rate limit and return 429 under stress', async () => {
            const user = await TestFactories.user().create();

            const promises = Array.from({ length: 6 }).map(() =>
                request(app.getHttpServer())
                    .post(route())
                    .set('x-force-throttler', 'true')
                    .send({
                        email: user.email.toString(),
                        password: 'wrong-password'
                    })
            );

            const responses = await Promise.all(promises);
            const has429 = responses.some(r => r.status === 429);
            expect(has429).toBe(true);
        });

        it('should allow multiple successful logins for the same user', async () => {
            const password = 'test-password';
            const user = await TestFactories.user().state({ password }).create();

            const responses = [];
            for (let i = 0; i < 3; i++) {
                const response = await request(app.getHttpServer())
                    .post(route())
                    .send({
                        email: user.email.toString(),
                        password,
                    });
                responses.push(response);
            }

            expect(responses[0].status).toBe(200);
            expect(responses[0].body.data.accessToken).toBeDefined();
            expect(responses[1].status).toBe(200);
            expect(responses[1].body.data.accessToken).toBeDefined();
            expect(responses[2].status).toBe(200);
            expect(responses[2].body.data.accessToken).toBeDefined();
        });

        it('should allow user to logout and invalidate session for that specific user', async () => {
            const password = 'test-password';
            const user = await TestFactories.user().state({ password }).create();

            const loginResponse = await request(app.getHttpServer())
                .post(route())
                .send({
                    email: user.email.toString(),
                    password,
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.data.accessToken).toBeDefined();
            expect(loginResponse.body.data.refreshToken).toBeDefined();

            const hashedRefreshToken = RefreshToken.hashToken(loginResponse.body.data.refreshToken)
            const refreshTokenRepository = app.get(RefreshTokenRepositoryPort)
            const exist = await refreshTokenRepository.findByTokenAndUserId(hashedRefreshToken, user.id)
            expect(exist).toBeTruthy();

            const logoutResponse = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Cookie', `refresh_token=${loginResponse.body.data.refreshToken}`)
                .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
                .send();

            expect(logoutResponse.status).toBe(204);

            const notExist = await refreshTokenRepository.findByTokenAndUserId(hashedRefreshToken, user.id)
            expect(notExist).toBeFalsy();
        });


    });


});