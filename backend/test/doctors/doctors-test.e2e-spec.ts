import request from 'supertest';
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestFactories } from '../factories/test-factories';
import { cleanupDatabase } from '../helpers/clean-up-database.helper';
import { setupTestApp } from '../helpers/setup-test.helper';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { MailerPort } from '@/modules/auth/domain/ports/mailer.port';

describe('Doctors Module E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
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

    describe('POST /doctors/profile', () => {
        const route = () => '/doctors/profile';

        it('Scenario 1: should successfully create a doctor profile with isVerified = false', async () => {
            const { user, auth } = await TestFactories.user().asDoctor().createAuthenticatedUser();

            const specialty = await TestFactories.specialty()
                .state({ name: 'Cardiology', description: 'Heart care' })
                .create();

            const payload = {
                licenseNumber: `MED-${faker.string.numeric(6)}`,
                bio: 'Experienced cardiologist',
                consultationFee: 150.0,
                specialtyIds: [specialty.id],
                avatar: 'https://example.com/avatar.png',
            };

            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.data.userId).toBe(user.id);
            expect(response.body.data.licenseNumber).toBe(payload.licenseNumber);
            expect(response.body.data.isVerified).toBe(false);
            expect(response.body.data.consultationFee).toBe(150);
            expect(response.body.data.specialties).toHaveLength(1);
            expect(response.body.data.specialties[0].id).toBe(specialty.id);

            const profileInDb = await prisma.doctorProfile.findUnique({
                where: { userId: user.id },
            });
            expect(profileInDb).toBeDefined();
            expect(profileInDb?.isVerified).toBe(false);
        });

        it('Scenario 3: should return 409 Conflict when doctor attempts to create duplicate profile', async () => {
            const { user, auth } = await TestFactories.user().asDoctor().createAuthenticatedUser();

            await TestFactories.doctorProfile()
                .state({ userId: user.id })
                .create();

            const payload = {
                licenseNumber: `MED-${faker.string.numeric(6)}`,
                bio: 'Second profile attempt',
            };

            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send(payload);

            expect(response.status).toBe(409);
        });

        it('Scenario 4: should return 403 Forbidden when user with PATIENT role attempts creation', async () => {
            const { auth } = await TestFactories.user().asPatient().createAuthenticatedUser();

            const payload = {
                licenseNumber: `MED-${faker.string.numeric(6)}`,
                bio: 'Patient attempting doctor creation',
            };

            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send(payload);

            expect(response.status).toBe(403);
        });
    });

    describe('GET /doctors', () => {
        const route = () => '/doctors';

        it('Scenario 2 & 5: should return only verified doctors and exclude unverified ones', async () => {
            const specialtyCardio = await TestFactories.specialty()
                .state({ name: 'Cardiology' })
                .create();

            const doctorUser1 = await TestFactories.user().asDoctor().create();
            await TestFactories.doctorProfile()
                .asVerified()
                .state({ userId: doctorUser1.id, specialtyIds: [specialtyCardio.id] })
                .create();

            const doctorUser2 = await TestFactories.user().asDoctor().create();
            await TestFactories.doctorProfile()
                .asUnverified()
                .state({ userId: doctorUser2.id, specialtyIds: [specialtyCardio.id] })
                .create();

            const response = await request(app.getHttpServer())
                .get(`${route()}?specialtyId=${specialtyCardio.id}`);

            expect(response.status).toBe(200);
            expect(response.body.data.total).toBe(1);
            expect(response.body.data.items).toHaveLength(1);
            expect(response.body.data.items[0].userId).toBe(doctorUser1.id);
            expect(response.body.data.items[0].isVerified).toBe(true);
        });
    });

    describe('PATCH /doctors/:id/verify', () => {
        it('Scenario 6: should allow ADMIN to verify a doctor profile', async () => {
            const { auth: adminAuth } = await TestFactories.user().asAdmin().createAuthenticatedUser();

            const doctorUser = await TestFactories.user().asDoctor().create();
            const unverifiedProfile = await TestFactories.doctorProfile()
                .asUnverified()
                .state({ userId: doctorUser.id })
                .create();

            const verifyResponse = await request(app.getHttpServer())
                .patch(`/doctors/${unverifiedProfile.id}/verify`)
                .set('Cookie', `access_token=${adminAuth.accessToken}`);

            expect(verifyResponse.status).toBe(200);
            expect(verifyResponse.body.data.isVerified).toBe(true);

            const searchResponse = await request(app.getHttpServer()).get('/doctors');
            expect(searchResponse.status).toBe(200);
            expect(searchResponse.body.data.total).toBe(1);
            expect(searchResponse.body.data.items[0].id).toBe(unverifiedProfile.id);
        });

        it('should return 403 Forbidden when non-admin tries to verify a profile', async () => {
            const { auth: doctorAuth } = await TestFactories.user().asDoctor().createAuthenticatedUser();

            const doctorUser = await TestFactories.user().asDoctor().create();
            const unverifiedProfile = await TestFactories.doctorProfile()
                .asUnverified()
                .state({ userId: doctorUser.id })
                .create();

            const response = await request(app.getHttpServer())
                .patch(`/doctors/${unverifiedProfile.id}/verify`)
                .set('Cookie', `access_token=${doctorAuth.accessToken}`);

            expect(response.status).toBe(403);
        });
    });
});
