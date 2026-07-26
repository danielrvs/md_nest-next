import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import { AbstractHttpAdapter, HttpAdapterHost } from "@nestjs/core";

@Catch() // vacío para que atrape todo
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        //obtener el contexto HTTP
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        //determinar código de estado
        const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        //extraer el mensaje de error limpio
        const responseBody = exception instanceof HttpException
            ? exception.getResponse()
            : { message: (exception as Error).message };

        //observabilidad
        this.log(httpStatus, httpAdapter, ctx, exception, responseBody)

        //construir payload
        const responsePayload = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            //si es un objeto (ej: validación fallida), lo expandimos, si no, mensaje simple
            ...(typeof responseBody === 'object' ? responseBody : { message: responseBody }),
        };

        httpAdapter.reply(ctx.getResponse(), responsePayload, httpStatus)
    }

    log(httpStatus: number, httpAdapter: AbstractHttpAdapter, ctx: HttpArgumentsHost, exception: unknown, responseBody: string | object) {
        if (httpStatus >= 500) {
            this.logger.error(
                `Critical Error at ${httpAdapter.getRequestUrl(ctx.getRequest())}`,
                exception instanceof Error ? exception.stack : String(exception)
            );
        } else {
            this.logger.warn(
                `Client Error (${httpStatus} at ${httpAdapter.getRequestUrl(ctx.getRequest())} : ${JSON.stringify(responseBody)})`
            );
        }
    }
}