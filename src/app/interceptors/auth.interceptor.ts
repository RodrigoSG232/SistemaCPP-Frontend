import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const rutasPublicas = [
    '/api/auth/login',
    '/api/auth/recuperar',
    '/api/auth/recuperar/verificar'
  ];
  
  const esPublica = rutasPublicas.some(ruta => req.url.includes(ruta));
  const token = localStorage.getItem('token');
  
  if (token && !esPublica) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
};