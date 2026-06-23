import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Recepcion } from './modules/recepcion/recepcion';
import { Caja } from './modules/caja/caja';
import { Psicologia } from './modules/psicologia/psicologia';
import { LoginComponent } from './modules/login/login';
import { Home } from './modules/landing/pages/home/home';
import { Admin } from './modules/admin/admin';
import { authChildGuard, authGuard } from './guards/auth-guard';
import { RecuperarContrasena } from './modules/recuperar-contrasena/recuperar-contrasena';
import { Perfil } from './modules/perfil/perfil';
import { Anfitriona } from './modules/anfitriona/anfitriona';
import { TicketComponent } from './modules/tickets-paciente/ticket.component';
import { Enfermera } from './modules/enfermera/enfermera';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar-contrasena', component: RecuperarContrasena },

  // Vista pública de tickets
  { path: 'tickets', component: TicketComponent },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: 'recepcion', component: Recepcion, data: { roles: ['RECEPCION', 'ADMIN'] } },
      { path: 'caja', component: Caja, data: { roles: ['CAJA', 'ADMIN'] } },
      { path: 'psicologia', component: Psicologia, data: { roles: ['PSICOLOGO', 'ADMIN'] } },
      { path: 'admin', component: Admin, data: { roles: ['ADMIN'] } },
      { path: 'perfil', component: Perfil },
      { path: 'anfitriona', component: Anfitriona, data: { roles: ['ANFITRIONA', 'ADMIN'] } },
      { path: 'enfermera', component: Enfermera, data: { roles: ['ENFERMERA', 'ADMIN'] } },
    ]
  },
  { path: '**', redirectTo: '' }
];
