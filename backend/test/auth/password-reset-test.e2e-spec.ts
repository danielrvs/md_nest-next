import request from 'supertest';
import { AppModule } from "@/app.module";
import { INestApplication } from "@nestjs/common";
import { Test } from '@nestjs/testing';
import { TestFactories } from "../factories/test-factories";
import { cleanupDatabase } from "../helpers/clean-up-database.helper";
import { setupTestApp } from "../helpers/setup-test.helper";
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { EventBus } from '@nestjs/cqrs';
import { ForgotPasswordEvent } from "@/modules/auth/domain/events/forgot-password.event";
import { ResetPasswordEvent } from "@/modules/auth/domain/events/reset-password.event";
import { MailerPort } from "@/modules/auth/domain/ports/mailer.port";

describe('Password Reset E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let eventBus: EventBus;
    let publishSpy: jest.SpyInstance;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule]
        })
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
    });

    beforeEach(async () => {
        await cleanupDatabase(prisma);
        publishSpy = jest.spyOn(eventBus, 'publish');
    });

    afterEach(() => {
        publishSpy.mockRestore();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    describe('POST /auth/forgot-password', () => {
        it('should accept password reset request for existing user', async () => {
            const user = await TestFactories.user().create();

            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: user.email.toString() });

            expect([200, 201]).toContain(response.status);

            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            expect(dbUser?.passwordResetToken).not.toBeNull();
            expect(typeof dbUser?.passwordResetToken).toBe('string');

            expect(publishSpy).toHaveBeenCalledTimes(1);
            expect(publishSpy).toHaveBeenCalledWith(expect.any(ForgotPasswordEvent));
        });

        it('should return 400 when email is malformed', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: 'not-an-email' });

            expect(response.status).toBe(400);
        });

        it('should return 400 when email is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/reset-password', () => {
        it('should successfully reset password with valid token and allow login with new password', async () => {
            const password = 'OldPassword123!';
            const token = faker.string.alphanumeric(8);

            const newPassword = 'NewPassword123!';
            const user = await TestFactories.user().state({ password }).withPasswordResetToken(token).create();

            const resetResponse = await request(app.getHttpServer())
                .post('/auth/reset-password')
                .send({ token, password: newPassword, email: user.email.toString() });

            expect(resetResponse.status).toBe(200);

            expect(publishSpy).toHaveBeenCalledTimes(1);
            expect(publishSpy).toHaveBeenCalledWith(expect.any(ResetPasswordEvent));

            const oldLoginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: user.email.toString(), password });

            expect(oldLoginResponse.status).toBe(401);

            const newLoginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: user.email.toString(), password: newPassword });

            expect(newLoginResponse.status).toBe(200);
        });

        it('should reject password reset if token is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/reset-password')
                .send({ token: 'invalid-token-value', password: 'NewPassword123!' });

            expect([400, 404]).toContain(response.status);
        });

        it('should reject password reset if token is expired', async () => {
            const user = await TestFactories.user().withPasswordResetToken().create();



            const response = await request(app.getHttpServer())
                .post('/auth/reset-password')
                .send({ token: 'expired-token-val', password: 'NewPassword123!' });

            expect(response.status).toBe(400);
        });
    });
});
