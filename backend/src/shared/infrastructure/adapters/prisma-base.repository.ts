import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "generated/prisma/client";

export abstract class PrismaBaseRepository {
    protected async handleDbOperation<T>(
        operation: () => Promise<T>,
        contextInfo?: {
            resourceName?: string;
            resourceId?: string;
        }
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            this.handlePrismaError(error, contextInfo);
        }
    }

    private handlePrismaError(error: unknown, context?: { resourceName?: string, resourceId?: string }): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const prismaError = error as Prisma.PrismaClientKnownRequestError;
            if (prismaError.code === 'P2003') {
                const msg = context?.resourceName ? `The resource ${context.resourceName}` : 'Resource not found.';
                throw new NotFoundException(msg);
            }

            if (prismaError.code === 'P2002') {
                const fields = (prismaError.meta as any)?.target || [];
                throw new ConflictException(`Duplicate entry for fields: ${fields}`);
            }
        }

        throw error as Error;
    }
}