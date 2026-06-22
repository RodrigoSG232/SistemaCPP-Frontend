import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const rutasPublicas = [
    '/auth/login',
    '/auth/recuperar',
    '/auth/recuperar/verificar',
    '/public/'
  ];
  
  const esPublica = rutasPublicas.some(ruta => req.url.includes(ruta));
  const token = sessionStorage.getItem('token');
  
  if (token && !esPublica) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
};
