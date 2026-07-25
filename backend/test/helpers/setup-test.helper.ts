import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from 'cookie-parser';

export function setupTestApp(app: INestApplication): void {
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }))
}