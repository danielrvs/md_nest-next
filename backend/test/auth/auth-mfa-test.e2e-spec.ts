import { AppModule } from "@/app.module";
import { PrismaService } from "@/shared/infrastructure/prisma/prisma.service";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TestFactories } from "../factories/test-factories";
import { cleanupDatabase } from "../helpers/clean-up-database.helper";
import { setupTestApp } from "../helpers/setup-test.helper";
import request from 'supertest';
import { generate, generateSecret } from "otplib";

describe('MFA Challenge & Activation Integration Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

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

    describe('POST /auth/mfa/setup', () => {
        const route = () => '/auth/mfa/setup';

        it('should return 401 if user is not fully authenticated', async () => {
            await request(app.getHttpServer())
                .post(route())
                .expect(401);
        });

        it('should generate TOTP secret, QR URI and plain text backup codes', async () => {
            const { user, auth } = await TestFactories.user().createAuthenticatedUser();

            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)

            expect(response.status).toBe(200);


            expect(response.body.data).toHaveProperty('qrCodeUri');
            expect(response.body.data.qrCodeUri).toContain('otpauth://totp/');

            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            expect(dbUser?.mfaSecret).not.toBeNull();
            expect(dbUser?.mfaFactorConfirmedAt).toBeNull();
        });
    });

    describe('POST /auth/mfa/activate', () => {
        const route = () => '/auth/mfa/activate';

        it('should reject activation if user only carries an unverified pre-auth token', async () => {
            const mfaSecret = await generateSecret();
            const { token } = await TestFactories.user().state({ mfaSecret }).createMfaUnverifiedUser();
            const totpCode = await generate({ secret: mfaSecret });

            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode })
                .expect(401);
        });

        it('should activate 2FA successfully and mutate DB state when valid session and code are provided', async () => {


            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .state({ mfaSecret })
                .createAuthenticatedUser();



            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode })
            expect(response.status).toBe(200);

            expect(response.body.data.backupCodes).toBeInstanceOf(Array);
            expect(response.body.data.backupCodes).toHaveLength(8);
            expect(typeof response.body.data.backupCodes[0]).toBe('string');

            const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
            expect(updatedUser?.mfaFactorConfirmedAt).not.toBeNull();
            expect(updatedUser?.mfaSecret).toBe(user.mfaSecret);


        });

        it('should reject if the provided totp code has not 6 digits', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createAuthenticatedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode: '12345' })
                .expect(400);
        });
    });

    describe('POST /auth/mfa/challenge', () => {
        const route = () => '/auth/mfa/challenge';

        it('should return 200 and set secure cookies when valid totp is provided', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, token } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createMfaUnverifiedUser();


            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode });

            expect(response.status).toBe(200);


            const cookies = response.get('Set-Cookie').join(';');
            expect(cookies).toContain('access_token=');
            expect(cookies).toContain('HttpOnly');
            expect(cookies).toContain('Secure');

            expect(response.body.data.user.id).toBe(user.id);
        });

        it('should reject the same TOTP code twice to prevent Anti-Replay attacks', async () => {

            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, token } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createMfaUnverifiedUser();



            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode })
                .expect(200);


            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode })
                .expect(401);
        });

        it('should reject if the provided totp code is invalid', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, token } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createMfaUnverifiedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode: '123456' })
                .expect(401);
        });

        it('should reject if the provided totp code has not 6 digits', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, token } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createMfaUnverifiedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${token}`)
                .send({ totpCode: '12345' })
                .expect(400);
        });
    });

    describe('POST /auth/mfa/deactivate', () => {
        const route = () => '/auth/mfa/deactivate';

        it('should reject if user is not authenticated', async () => {
            await request(app.getHttpServer())
                .post(route())
                .expect(401);
        });

        it('should deactivate 2FA successfully', async () => {

            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createAuthenticatedUser();
            const response = await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode })
                .expect(200);

            const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
            expect(updatedUser?.mfaSecret).toBeNull();
            expect(updatedUser?.mfaFactorConfirmedAt).toBeNull();

            const mfaBackupCodes = await prisma.mfaBackupCodes.findMany({ where: { userId: user.id } });
            expect(mfaBackupCodes).toHaveLength(0);
        });

        it('should reject if 2FA is not activated', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .createAuthenticatedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode })
                .expect(400);
        });

        it('should reject if the provided totp code is invalid', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createAuthenticatedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode: '123456' })
                .expect(401);
        });

        it('should reject if the provided totp code has not 6 digits', async () => {
            const mfaSecret = await generateSecret();
            const totpCode = await generate({ secret: mfaSecret });

            const { user, auth } = await TestFactories.user()
                .with2FA()
                .state({ mfaSecret })
                .createAuthenticatedUser();
            await request(app.getHttpServer())
                .post(route())
                .set('Cookie', `access_token=${auth.accessToken}`)
                .send({ totpCode: '12345' })
                .expect(400);
        });
    });


});