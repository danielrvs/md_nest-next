import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { LoginReqDto } from "../../application/dtos/login.req.dto";
import { LoginResDto } from "../../application/dtos/login.res.dto";
import { LoginCommand } from "../../application/commands/login.command";
import { ResponseMessage } from "@/shared/infrastructure/decorators/response-message.decorator";
import { MFALoginResDto } from "../../application/dtos/mfa-login.res.dto";
import { Response } from "express";
import { CurrentUser } from "@/shared/infrastructure/decorators/current-user.decorator";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";
import { LogoutCommand } from "../../application/commands/logout.command";
import { CustomThrottlerGuard } from "@/shared/infrastructure/guards/custom-throttler.guard";
import { Public } from "@/shared/infrastructure/decorators/public.decorator";
import { ConfigService } from "@nestjs/config";
import { RegisterResDto } from "../../application/dtos/register.res.dto";
import { RegisterReqDto } from "../../application/dtos/register.req.dto";
import { RegisterCommand } from "../../application/commands/register.command";
import { ForgotPasswordCommand } from "../../application/commands/forgot-password.command";
import { ResetPasswordCommand } from "../../application/commands/reset-password.command";
import { ResetPasswordReqDto } from "../../application/dtos/reset-password.req.dto";
import { ForgotPasswordReqDto } from "../../application/dtos/forgot-password.req.dto";


@Controller('auth')
@UseGuards(CustomThrottlerGuard)
export class AuthController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly configService: ConfigService
    ) { }

    @Post('login')
    @Public()
    @ResponseMessage("User logged in successfully")
    async login(@Body() dto: LoginReqDto, @Res({ passthrough: true }) res: Response): Promise<LoginResDto | MFALoginResDto> {
        const command = new LoginCommand(dto.email, dto.password);
        const result = await this.commandBus.execute<LoginCommand, LoginResDto | MFALoginResDto>(command);

        const expiresIn = this.configService.get<number>('auth.accessTokenExpiry');
        const accessTokenName = this.configService.get<string>('auth.accessTokenCookie');


        if (result.mfaRequired === true) {
            const resMFALogin = result as MFALoginResDto;
            res.status(HttpStatus.ACCEPTED)
            res.cookie(accessTokenName, resMFALogin.mfaToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: expiresIn * 1000
            });
            return result;
        }


        const resLogin = result as LoginResDto;
        const refreshTokenExpiresIn = this.configService.get<number>('auth.refreshTokenExpiry');
        const refreshTokenName = this.configService.get<string>('auth.refreshTokenCookie');

        res.cookie(accessTokenName, resLogin.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: expiresIn * 1000
        });

        res.cookie(refreshTokenName, resLogin.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: refreshTokenExpiresIn * 1000
        });



        res.status(HttpStatus.OK)
        return result;
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ResponseMessage("User logged out successfully")
    async logout(
        @CurrentUser() user: Authenticated,
        @Req() req: any,
        @Res({ passthrough: true }) res: Response
    ): Promise<void> {
        const accessTokenName = this.configService.get<string>('auth.accessTokenCookie');
        const refreshTokenName = this.configService.get<string>('auth.refreshTokenCookie');

        const refreshToken = req.cookies?.[refreshTokenName] || req.body?.refreshToken;
        const command = new LogoutCommand(user.userId, refreshToken);
        await this.commandBus.execute<LogoutCommand>(command);

        res.clearCookie(accessTokenName);
        res.clearCookie(refreshTokenName);
    }

    @Post('register')
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @ResponseMessage("User registered successfully")
    async register(@Body() dto: RegisterReqDto): Promise<RegisterResDto> {
        const command = new RegisterCommand(dto.name, dto.email, dto.password, dto.tenantId);
        const result = await this.commandBus.execute<RegisterCommand, RegisterResDto>(command);
        return result;
    }

    @Post('forgot-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ResponseMessage("Password reset request sent successfully")
    async forgotPassword(@Body() dto: ForgotPasswordReqDto): Promise<void> {
        const command = new ForgotPasswordCommand(dto.email);
        await this.commandBus.execute<ForgotPasswordCommand>(command);
    }

    @Post('reset-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ResponseMessage("Password reset successfully")
    async resetPassword(@Body() dto: ResetPasswordReqDto): Promise<void> {
        const command = new ResetPasswordCommand(dto.email, dto.token, dto.password);
        await this.commandBus.execute<ResetPasswordCommand>(command);
    }

}