import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/infrastructure/decorators/public.decorator';
import { Roles } from '@/shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@/shared/infrastructure/guards/roles.guard';
import { JwtAuthGuard } from '@/shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { Authenticated } from '@/modules/auth/domain/interfaces/authenticated.interface';
import { UserRole } from '@/modules/users/domain/entities/enums/user-role.enum';
import { CreateDoctorProfileReqDto } from '../../application/dtos/create-doctor-profile.req.dto';
import { GetDoctorsQueryDto } from '../../application/dtos/get-doctors-query.dto';
import { DoctorProfileResDto } from '../../application/dtos/doctor-profile.res.dto';
import { DoctorListResDto } from '../../application/dtos/doctor-list.res.dto';
import { CreateDoctorProfileCommand } from '../../application/commands/create-doctor-profile.command';
import { GetDoctorsQuery } from '../../application/queries/get-doctors.query';
import { VerifyDoctorProfileCommand } from '../../application/commands/verify-doctor-profile.command';
import { DoctorProfile } from '../../domain/entities/doctor-profile.entity';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @ApiOperation({ summary: 'Create a doctor profile for the authenticated DOCTOR' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.DOCTOR)
    @Post('profile')
    @ApiResponse({ status: 201, type: DoctorProfileResDto, description: 'Doctor profile created with isVerified = false' })
    @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions for non-doctor users' })
    @ApiResponse({ status: 409, description: 'Conflict: Doctor profile already exists' })
    async createProfile(
        @CurrentUser() user: Authenticated,
        @Body() dto: CreateDoctorProfileReqDto,
    ): Promise<DoctorProfileResDto> {
        const command = new CreateDoctorProfileCommand(
            user.userId,
            dto.licenseNumber,
            dto.bio,
            dto.consultationFee,
            dto.specialtyIds,
            dto.avatar,
        );

        const profile: DoctorProfile = await this.commandBus.execute(command);
        return DoctorProfileResDto.fromEntity(profile);
    }

    @ApiOperation({ summary: 'Search verified doctors with optional specialty filter and pagination' })
    @Public()
    @Get()
    @ApiResponse({ status: 200, type: DoctorListResDto, description: 'Paginated list of verified doctors' })
    async getDoctors(@Query() queryDto: GetDoctorsQueryDto): Promise<DoctorListResDto> {
        const query = new GetDoctorsQuery(
            queryDto.specialtyId,
            queryDto.page,
            queryDto.perPage,
        );

        return await this.queryBus.execute(query);
    }

    @ApiOperation({ summary: 'Verify or unverify a doctor profile (Admin only)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id/verify')
    @ApiResponse({ status: 200, type: DoctorProfileResDto, description: 'Doctor profile verification status updated' })
    @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
    @ApiResponse({ status: 404, description: 'Not Found: Doctor profile not found' })
    async verifyDoctor(@Param('id') id: string): Promise<DoctorProfileResDto> {
        const command = new VerifyDoctorProfileCommand(id, true);
        const profile: DoctorProfile = await this.commandBus.execute(command);
        return DoctorProfileResDto.fromEntity(profile);
    }
}
