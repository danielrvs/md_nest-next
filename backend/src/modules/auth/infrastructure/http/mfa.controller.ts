import { CurrentUser } from "@/shared/infrastructure/decorators/current-user.decorator";
import { Public } from "@/shared/infrastructure/decorators/public.decorator";
import { ResponseMessage } from "@/shared/infrastructure/decorators/response-message.decorator";
import { JwtMfaAuthGuard } from "@/shared/infrastructure/guards/jwt-mfa-auth.guard";
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { MfaChallengeReqDto } from "../../application/dtos/mfa-challenge.req.dto";
import { MfaAuthenticated } from "../../domain/interfaces/mfa-authenticated.interface";
import { LoginResDto } from "../../application/dtos/login.res.dto";
import { MfaChallengeCommand } from "../../application/commands/mfa-challenge.command";
import { CommandBus } from "@nestjs/cqrs";
import { Response } from "express";
import { Authenticated } from "../../domain/interfaces/authenticated.interface";
import { MfaSetupCommand } from "../../application/commands/mfa-setup.command";
import { MfaSetupResDto } from "../../application/dtos/mfa-setup.res.dto";
import { MfaActivateCommand } from "../../application/commands/mfa-activate.command";
import { MfaDeactivateCommand } from "../../application/commands/mfa-deactivate.command";
import { MfaActivateReqDto } from "../../application/dtos/mfa-activate.req.dto";
import { MfaDeactivateReqDto } from "../../application/dtos/mfa-deactivate.req.dto";
import { MfaActivateResDto } from "../../application/dtos/mfa-activate.res.dto";
import { ConfigService } from "@nestjs/config";


@Controller('auth/mfa')
export class MfaController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly configService: ConfigService
    ) { }

    @Post('setup')
    @ResponseMessage('MFA setup initiated')
    @HttpCode(HttpStatus.OK)
    async mfaSetup(@CurrentUser() user: Authenticated): Promise<MfaSetupResDto> {
        const command = new MfaSetupCommand(user);
        const res = await this.commandBus.execute<MfaSetupCommand, string>(command);
        return {
            qrCodeUri: res
        }
    }

    @Post('activate')
    @ResponseMessage('MFA setup activated')
    @HttpCode(HttpStatus.OK)
    async mfaActivate(@CurrentUser() user: Authenticated, @Body() request: MfaActivateReqDto): Promise<MfaActivateResDto> {
        const command = new MfaActivateCommand(user, request.totpCode);
        const res = await this.commandBus.execute<MfaActivateCommand, string[]>(command);
        return {
            backupCodes: res
        }
    }


    @Post('challenge')
    @Public()
    @UseGuards(JwtMfaAuthGuard)
    @ResponseMessage('MFA challenge completed successfully')
    @HttpCode(HttpStatus.OK)
    async mfaChallenge(
        @Body() dto: MfaChallengeReqDto,
        @CurrentUser() user: MfaAuthenticated,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResDto> {
        const command = new MfaChallengeCommand(user, dto.totpCode);
        const result = await this.commandBus.execute<MfaChallengeCommand, LoginResDto>(command);

        const expiresIn = this.configService.get<number>('auth.accessTokenExpiry');
        const accessTokenName = this.configService.get<string>('auth.accessTokenCookie');
        const refreshTokenExpiresIn = this.configService.get<number>('auth.refreshTokenExpiry');
        const refreshTokenName = this.configService.get<string>('auth.refreshTokenCookie');

        res.cookie(accessTokenName, result.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: expiresIn * 1000
        });

        res.cookie(refreshTokenName, result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: refreshTokenExpiresIn * 1000
        });

        return result;
    }

    @Post('deactivate')
    @ResponseMessage('MFA setup deactivated')
    @HttpCode(HttpStatus.OK)
    async mfaDeactivate(@CurrentUser() user: Authenticated, @Body() request: MfaDeactivateReqDto): Promise<void> {
        const command = new MfaDeactivateCommand(user, request.totpCode);
        await this.commandBus.execute<MfaDeactivateCommand, void>(command);
    }


}