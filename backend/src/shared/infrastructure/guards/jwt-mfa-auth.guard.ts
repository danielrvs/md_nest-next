import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Authenticated } from "@/modules/auth/domain/interfaces/authenticated.interface";
import { MfaAuthenticated } from "@/modules/auth/domain/interfaces/mfa-authenticated.interface";


@Injectable()
export class JwtMfaAuthGuard extends AuthGuard('jwt') implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isValid = await super.canActivate(context);
        if (!isValid) return false;

        const request = context.switchToHttp().getRequest();
        const user: Authenticated | MfaAuthenticated = request.user;

        if (!user?.isMfaPending) throw new UnauthorizedException("Invalid token scope for intermediate MFA step");

        return isValid as boolean;
    }
}
