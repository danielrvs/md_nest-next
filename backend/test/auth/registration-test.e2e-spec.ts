import request from 'supertest';
import { AppModule } from "@/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from '@nestjs/testing';
import { TestFactories } from "../factories/test-factories";
import { cleanupDatabase } from "../helpers/clean-up-database.helper";
import { setupTestApp } from "../helpers/setup-test.helper";
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { faker } from "@faker-js/faker";
import { EventBus } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '@/modules/auth/domain/events/user-registered.event';
import { MailerPort } from '@/modules/auth/domain/ports/mailer.port';

describe('Registration Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let eventBus: EventBus;
    let publishSpy: jest.SpyInstance;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule(
            {
                imports: [AppModule]
            }
        )
            .overrideProvider(MailerPort)
            .useValue({
                sendWelcomeEmail: jest.fn(),
                sendForgotPasswordEmail: jest.fn(),
                sendResetPasswordEmail: jest.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        setupTestApp(app);
        prisma = app.get(PrismaService);
        eventBus = app.get(EventBus);

        TestFactories.init(app);
        await app.init();
    })

    beforeEach(async () => {
        await cleanupDatabase(prisma);
        publishSpy = jest.spyOn(eventBus, 'publish');
    })

    afterEach(() => {
        publishSpy.mockRestore();
    })

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    })

    describe('POST /auth/register', () => {
        const route = () => '/auth/register';

        it('should successfully register a new user', async () => {
            const tenant = await TestFactories.tenant().create();
            const password = 'test-passworD123';
            const email = faker.internet.email();
            const name = faker.person.fullName();

            const response = await request(app.getHttpServer())
                .post(route())
                .send({
                    name,
                    email,
                    password,
                    tenantId: tenant.id
                });

            expect(response.status).toBe(201);
            expect(response.body.data.email).toBe(email);

            const user = await prisma.user.findUnique({ where: { email } });
            expect(user).toBeDefined();
            expect(user?.email).toBe(email);

            expect(publishSpy).toHaveBeenCalledTimes(1);
            expect(publishSpy).toHaveBeenCalledWith(
                expect.any(UserRegisteredEvent)
            );
            expect(publishSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: user?.id,
                    tenantId: tenant.id,
                    email: email,
                    name: name,
                    role: 'VIEWER'
                })
            );
        });

        it('should return 409 when email already exists in tenant', async () => {
            const tenant = await TestFactories.tenant().create();
            const password = 'test-passworD123';
            const user = await TestFactories.user().state({ tenantId: tenant.id }).create();
            const response = await request(app.getHttpServer())
                .post(route())
                .send({
                    name: faker.person.fullName(),
                    email: user.email.toString(),
                    password,
                    tenantId: tenant.id
                });
            expect(response.status).toBe(409);
        });

        it('should return 400 when request malformed', async () => {
            const tenant = await TestFactories.tenant().create();
            const password = 'test-passworD123';
            const malformedRequests = [
                { name: faker.person.fullName(), password: 'weak-password' },
                { name: faker.person.fullName(), email: faker.internet.email(), tenantId: tenant.id },
                { name: faker.person.fullName(), email: 'invalid-email', password, tenantId: tenant.id },
                { name: faker.person.fullName(), email: 'invalid-email', password, tenantId: '123' },
            ]

            for (const input of malformedRequests) {
                const response = await request(app.getHttpServer())
                    .post(route())
                    .send(input);
                expect(response.status).toBe(400);
            }
        });

        it('should enforce rate limit and return 429 under stress', async () => {
            const tenant = await TestFactories.tenant().create();
            const password = 'test-passworD123';
            const promises = Array.from({ length: 6 }).map(() =>
                request(app.getHttpServer())
                    .post(route())
                    .set('x-force-throttler', 'true')
                    .send({
                        name: faker.person.fullName(),
                        email: faker.internet.email(),
                        password,
                        tenantId: tenant.id
                    })
            );

            const responses = await Promise.all(promises);
            const has429 = responses.some(r => r.status === 429);
            expect(has429).toBe(true);
        })
    })
});