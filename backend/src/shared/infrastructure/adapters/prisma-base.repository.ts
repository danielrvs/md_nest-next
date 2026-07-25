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

    private handlePrismaError(error: any, context?: { resourceName?: string, resourceId?: string }) {

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                const msg = context?.resourceName ? `The resource ${context.resourceName}` : 'Resource not found.';
                throw new NotFoundException(msg);
            }

            if (error.code === 'P2002') {
                const fields = (error.meta as any)?.target || [];
                throw new ConflictException(`Duplicate entry for fields: ${fields}`);
            }
        }

        throw error;
    }
}