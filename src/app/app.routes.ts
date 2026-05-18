import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Recepcion } from './modules/recepcion/recepcion';
import { Caja } from './modules/caja/caja';
import { Psicologia } from './modules/psicologia/psicologia';
import { LoginComponent } from './modules/login/login';
import { Home } from './modules/landing/pages/home/home';
import { Admin } from './modules/admin/admin';

export const routes: Routes = [
  
  { path: '', component: Home, pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'recepcion', component: Recepcion },
      { path: 'caja', component: Caja },
      { path: 'psicologia', component: Psicologia },
      { path: 'admin', component: Admin },
    ]
  },
  { path: '**', redirectTo: '' }
];