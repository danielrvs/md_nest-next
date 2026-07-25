-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfa_factor_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "mfa_secret" TEXT,
ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" VARCHAR(255);
