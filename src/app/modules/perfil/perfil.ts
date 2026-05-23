import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  nombreCompleto = '';
  email = '';
  username = '';
  rol = '';
  nuevaPassword = '';
  confirmarPassword = '';
  mensaje = '';
  error = '';
  cargando = false;
  guardando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargando = true;
    this.authService.getPerfil().subscribe({
      next: (data) => {
        this.nombreCompleto = data.nombreCompleto;
        this.email = data.email || '';
        this.username = data.username;
        this.rol = data.rol;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar el perfil';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardar() {
    if (this.nuevaPassword && this.nuevaPassword !== this.confirmarPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    const body: any = {
      nombreCompleto: this.nombreCompleto,
      email: this.email
    };
    if (this.nuevaPassword) {
      body.password = this.nuevaPassword;
    }

    this.authService.updatePerfil(body).subscribe({
      next: (res) => {
        localStorage.setItem('usuarioActual', res.nombreCompleto);
        this.mensaje = 'Perfil actualizado correctamente';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.guardando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error al actualizar el perfil';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver() {
  history.back();
  }
}
