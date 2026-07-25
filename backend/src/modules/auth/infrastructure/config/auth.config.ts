import { registerAs } from "@nestjs/config";

export default registerAs('auth', () => ({
    accessTokenCookie: process.env.ACCESS_TOKEN_COOKIE || 'access_token',
    accessTokenSecret: process.env.JWT_SECRET || 'access_token_secret',
    accessTokenExpiry: parseInt(process.env.JWT_EXPIRY || '3600', 10), //seconds
    refreshTokenCookie: process.env.REFRESH_TOKEN_COOKIE || 'refresh_token',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret',
    refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10), //seconds
    backupCodesCount: parseInt(process.env.BACKUP_CODES_COUNT || '8', 10)
}));