import request from 'supertest';
import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestFactories } from '../factories/test-factories';
import { cleanupDatabase } from '../helpers/clean-up-database.helper';
import { setupTestApp } from '../helpers/setup-test.helper';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { MailerPort } from '@/modules/auth/domain/ports/mailer.port';

describe('Specialties CRUD E2E Tests', () => {
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

    describe('Scenario 1: GET /specialties - Listado público y Cache en Redis', () => {
        it('should return 200 OK with active specialties sorted alphabetically and cache in Redis', async () => {
            await TestFactories.specialty()
                .asActive()
                .state({ name: 'Cardiología', slug: 'cardiologia', description: 'Cuidado del corazón' })
                .create();

            await TestFactories.specialty()
                .asActive()
                .state({ name: 'Dermatología', slug: 'dermatologia', description: 'Cuidado de la piel' })
                .create();

            const res1 = await request(app.getHttpServer()).get('/specialties');

            expect(res1.status).toBe(200);
            expect(res1.body.data).toHaveLength(2);
            expect(res1.body.data[0].name).toBe('Cardiología');
            expect(res1.body.data[1].name).toBe('Dermatología');

            // Second request relies on Redis cache
            const res2 = await request(app.getHttpServer()).get('/specialties');
            expect(res2.status).toBe(200);
            expect(res2.body.data).toEqual(res1.body.data);
        });
    });

    describe('Scenario 2: POST /specialties - Creación por Admin e Invalidación de Cache', () => {
        it('should allow ADMIN to create a specialty and invalidate cache', async () => {
            const { auth: adminAuth } = await TestFactories.user().asAdmin().createAuthenticatedUser();

            // Populate cache first
            await request(app.getHttpServer()).get('/specialties');

            const payload = {
                name: 'Neurología',
                description: 'Cuidado del sistema nervioso',
                icon: 'brain-icon',
            };

            const createRes = await request(app.getHttpServer())
                .post('/specialties')
                .set('Cookie', `access_token=${adminAuth.accessToken}`)
                .send(payload);

            expect(createRes.status).toBe(201);
            expect(createRes.body.data.name).toBe('Neurología');
            expect(createRes.body.data.slug).toBe('neurologia');

            // Subsequent GET should return newly created specialty (cache invalidated)
            const listRes = await request(app.getHttpServer()).get('/specialties');
            expect(listRes.status).toBe(200);
            const found = listRes.body.data.find((s: any) => s.name === 'Neurología');
            expect(found).toBeDefined();
        });
    });

    describe('Scenario 3: Rechazo de creación por usuario no administrador', () => {
        it('should return 403 Forbidden for PATIENT or DOCTOR role', async () => {
            const { auth: patientAuth } = await TestFactories.user().asPatient().createAuthenticatedUser();
            const { auth: doctorAuth } = await TestFactories.user().asDoctor().createAuthenticatedUser();

            const resPatient = await request(app.getHttpServer())
                .post('/specialties')
                .set('Cookie', `access_token=${patientAuth.accessToken}`)
                .send({ name: 'Pediatría' });

            expect(resPatient.status).toBe(403);

            const resDoctor = await request(app.getHttpServer())
                .post('/specialties')
                .set('Cookie', `access_token=${doctorAuth.accessToken}`)
                .send({ name: 'Pediatría' });

            expect(resDoctor.status).toBe(403);
        });
    });

    describe('Scenario 4: Intento de especialidad duplicada', () => {
        it('should return 409 Conflict when attempting to create duplicate specialty name', async () => {
            const { auth: adminAuth } = await TestFactories.user().asAdmin().createAuthenticatedUser();

            await TestFactories.specialty()
                .asActive()
                .state({ name: 'Cardiología', slug: 'cardiologia' })
                .create();

            const response = await request(app.getHttpServer())
                .post('/specialties')
                .set('Cookie', `access_token=${adminAuth.accessToken}`)
                .send({ name: 'Cardiología', description: 'Duplicado' });

            expect(response.status).toBe(409);
        });
    });
});
