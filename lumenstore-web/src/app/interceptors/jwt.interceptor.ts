import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    // Clone request and add headers
    let headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (Object.keys(headers).length > 0) {
      request = request.clone({ setHeaders: headers });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
          this.notification.warning('Tu sesión ha expirado. Inicia sesión nuevamente.');
        } else if (error.status === 0) {
          this.notification.error(
            'No se puede conectar con el servidor. Verifica tu conexión.',
            'Error de conexión',
          );
        } else if (error.status >= 500) {
          this.notification.error(
            'Ocurrió un error en el servidor. Intenta más tarde.',
            'Error del servidor',
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
