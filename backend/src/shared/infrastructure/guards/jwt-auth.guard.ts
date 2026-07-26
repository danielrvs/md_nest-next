import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { Authenticated } from "@/modules/auth/domain/interfaces/authenticated.interface";
import { MfaAuthenticated } from "@/modules/auth/domain/interfaces/mfa-authenticated.interface";


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {

    constructor(
        private readonly reflector: Reflector
    ) { super(); }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const isValid = await super.canActivate(context);
        if (!isValid) return false;

        const request = context.switchToHttp().getRequest();
        const user: Authenticated | MfaAuthenticated = request.user;

        if (user?.isMfaPending) throw new UnauthorizedException("MFA verification is required");

        return isValid as boolean;
    }
}
