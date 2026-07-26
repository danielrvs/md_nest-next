import { ApiResponse } from "@/shared/domain/interfaces/api-response.interface";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { RESPONSE_MESSAGE_KEY } from "../decorators/response-message.decorator";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> | Promise<Observable<ApiResponse<T>>> {
        return next.handle().pipe(
            map((data) => {
                const customMessage = this.reflector.get<string>(
                    RESPONSE_MESSAGE_KEY,
                    context.getHandler()
                )
                return {
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    message: customMessage || 'Request successful',
                    timestamp: new Date().toISOString(),
                    data,
                }
            })
        )
    }
}