import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  return validarAcceso(route);
};

export const authChildGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot) => {
  return validarAcceso(route);
};

function validarAcceso(route: ActivatedRouteSnapshot): boolean {
  const router = inject(Router);

  const token = sessionStorage.getItem('token');
  const rol = sessionStorage.getItem('rol');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = route.data?.['roles'] as string[] | undefined;
  if (!rolesPermitidos || rolesPermitidos.includes(rol || '')) {
    return true;
  }

  router.navigate([rutaPorRol(rol)]);
  return false;
}

function rutaPorRol(rol: string | null): string {
  const rutas: Record<string, string> = {
    ADMIN: '/admin',
    RECEPCION: '/recepcion',
    CAJA: '/caja',
    PSICOLOGO: '/psicologia',
    ANFITRIONA: '/anfitriona',
    ENFERMERA: '/enfermera'
  };

  return rutas[rol || ''] || '/login';
}
