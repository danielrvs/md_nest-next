import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/shared/infrastructure/decorators/public.decorator';
import { Roles } from '@/shared/infrastructure/decorators/roles.decorator';
import { RolesGuard } from '@/shared/infrastructure/guards/roles.guard';
import { JwtAuthGuard } from '@/shared/infrastructure/guards/jwt-auth.guard';
import { UserRole } from '@/modules/users/domain/entities/enums/user-role.enum';
import { CreateSpecialtyReqDto } from '../../application/dtos/create-specialty.req.dto';
import { UpdateSpecialtyReqDto } from '../../application/dtos/update-specialty.req.dto';
import { SpecialtyResDto } from '../../application/dtos/specialty.res.dto';
import { CreateSpecialtyCommand } from '../../application/commands/create-specialty.command';
import { UpdateSpecialtyCommand } from '../../application/commands/update-specialty.command';
import { DeleteSpecialtyCommand } from '../../application/commands/delete-specialty.command';
import { GetSpecialtiesQuery } from '../../application/queries/get-specialties.query';
import { GetSpecialtyByIdQuery } from '../../application/queries/get-specialty-by-id.query';
import { Specialty } from '../../domain/entities/specialty.entity';

@ApiTags('Specialties')
@Controller('specialties')
export class SpecialtiesController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @ApiOperation({ summary: 'Create a new medical specialty (Admin only)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    @ApiResponse({ status: 201, type: SpecialtyResDto, description: 'Medical specialty created successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
    @ApiResponse({ status: 409, description: 'Conflict: Specialty with slug already exists' })
    async createSpecialty(@Body() dto: CreateSpecialtyReqDto): Promise<SpecialtyResDto> {
        const command = new CreateSpecialtyCommand(
            dto.name,
            dto.slug,
            dto.description,
            dto.icon,
            dto.image,
        );

        const specialty: Specialty = await this.commandBus.execute(command);
        return {
            id: specialty.id,
            name: specialty.name,
            slug: specialty.slug,
            description: specialty.description ?? undefined,
            icon: specialty.icon ?? undefined,
            image: specialty.image ?? undefined,
            isActive: specialty.isActive,
        };
    }

    @ApiOperation({ summary: 'List all medical specialties' })
    @Public()
    @Get()
    @ApiResponse({ status: 200, type: [SpecialtyResDto], description: 'List of medical specialties' })
    async getSpecialties(@Query('all') all?: string): Promise<SpecialtyResDto[]> {
        const includeInactive = all === 'true';
        return await this.queryBus.execute(new GetSpecialtiesQuery(includeInactive));
    }

    @ApiOperation({ summary: 'Get medical specialty by ID' })
    @Public()
    @Get(':id')
    @ApiResponse({ status: 200, type: SpecialtyResDto, description: 'Medical specialty details' })
    @ApiResponse({ status: 404, description: 'Not Found: Specialty not found' })
    async getSpecialtyById(@Param('id') id: string): Promise<SpecialtyResDto> {
        return await this.queryBus.execute(new GetSpecialtyByIdQuery(id));
    }

    @ApiOperation({ summary: 'Update a medical specialty (Admin only)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    @ApiResponse({ status: 200, type: SpecialtyResDto, description: 'Medical specialty updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
    @ApiResponse({ status: 404, description: 'Not Found: Specialty not found' })
    async updateSpecialty(
        @Param('id') id: string,
        @Body() dto: UpdateSpecialtyReqDto,
    ): Promise<SpecialtyResDto> {
        const command = new UpdateSpecialtyCommand(
            id,
            dto.name,
            dto.slug,
            dto.description,
            dto.icon,
            dto.image,
            dto.isActive,
        );

        const specialty: Specialty = await this.commandBus.execute(command);
        return {
            id: specialty.id,
            name: specialty.name,
            slug: specialty.slug,
            description: specialty.description ?? undefined,
            icon: specialty.icon ?? undefined,
            image: specialty.image ?? undefined,
            isActive: specialty.isActive,
        };
    }

    @ApiOperation({ summary: 'Delete a medical specialty (Admin only)' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiResponse({ status: 200, description: 'Medical specialty deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
    @ApiResponse({ status: 404, description: 'Not Found: Specialty not found' })
    async deleteSpecialty(@Param('id') id: string): Promise<{ success: boolean }> {
        const success: boolean = await this.commandBus.execute(new DeleteSpecialtyCommand(id));
        return { success };
    }
}
