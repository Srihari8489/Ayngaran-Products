import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If the handler returned a paginated structure
        if (result && typeof result === 'object' && 'pagination' in result) {
          return {
            success: true,
            message: (result as any).message || 'Operation completed successfully',
            data: result.data !== undefined ? result.data : result,
            pagination: result.pagination,
            ...result,
          };
        }

        // If the handler already returned a formatted structure with message/data
        if (result && typeof result === 'object' && 'data' in result && 'message' in result) {
          return {
            success: true,
            message: result.message,
            data: result.data,
            ...result,
          };
        }

        return {
          success: true,
          message: 'Operation completed successfully',
          data: result,
        };
      }),
    );
  }
}
