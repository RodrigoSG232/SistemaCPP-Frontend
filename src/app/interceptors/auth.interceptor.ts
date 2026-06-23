import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const rutasPublicas = [
    '/auth/login',
    '/auth/refresh',
    '/auth/recuperar',
    '/auth/recuperar/verificar',
    '/public/'
  ];
  
  const esPublica = rutasPublicas.some(ruta => req.url.includes(ruta));
  const token = sessionStorage.getItem('token');

  const requestConToken = token && !esPublica
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(requestConToken).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = sessionStorage.getItem('refreshToken');

      if (error.status !== 401 || esPublica || !refreshToken) {
        return throwError(() => error);
      }

      return http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
        switchMap((res) => {
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('refreshToken', res.refreshToken);
          sessionStorage.setItem('usuarioActual', res.nombreCompleto || res.username);
          sessionStorage.setItem('rol', res.rol);

          const retryRequest = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${res.token}`)
          });
          return next(retryRequest);
        }),
        catchError((refreshError) => {
          sessionStorage.clear();
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('usuarioActual');
          localStorage.removeItem('rol');
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
