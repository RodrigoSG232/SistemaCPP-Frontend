import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar implements OnInit {
  nombreUsuario = '';
  rol = '';
  inicial = 'U';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.nombreUsuario = sessionStorage.getItem('usuarioActual') || 'Usuario';
    this.rol = sessionStorage.getItem('rol') || '';
    this.inicial = this.nombreUsuario.charAt(0).toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get rolLabel(): string {
    const map: Record<string, string> = {
      RECEPCION: 'Recepción',
      CAJA: 'Caja',
      PSICOLOGO: 'Psicólogo',
      ADMIN: 'Administrador',
      ANFITRIONA: 'Anfitriona'
    };
    return map[this.rol] || this.rol;
  }
  irAPerfil() {
    this.router.navigate(['/perfil']);
    }
}
