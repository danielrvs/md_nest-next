import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";
import { MfaAuthenticated } from "../../domain/interfaces/mfa-authenticated.interface";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors
                ([
                    (req: Request) => {
                        if (req && req.cookies) {
                            return req.cookies['access_token'] || null;
                        }
                        return null
                    },
                    ExtractJwt.fromAuthHeaderAsBearerToken()
                ]),
            secretOrKey: process.env.JWT_SECRET,
            ignoreExpiration: false,
        })
    }

    async validate(payload: any): Promise<Authenticated | MfaAuthenticated> {
        if (payload.isMfaPending) {
            return {
                userId: payload.userId,
                isMfaPending: payload.isMfaPending,
            } as MfaAuthenticated;
        }
        return {
            tenantId: payload.tenantId,
            userId: payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            isMfaPending: payload.isMfaPending,
        } as Authenticated;
    }
}