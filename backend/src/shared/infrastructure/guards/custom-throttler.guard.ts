import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (process.env.NODE_ENV !== 'production') {
            return request.headers['x-force-throttler'] !== 'true';
        }
        return false;
    }
}