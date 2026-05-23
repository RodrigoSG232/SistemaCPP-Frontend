import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {
  paso = 1;
  email = '';
  codigo = '';
  nuevaPassword = '';
  confirmarPassword = '';
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  solicitarCodigo() {
    if (!this.email) { this.error = 'Ingrese su email'; return; }
    this.cargando = true;
    this.error = '';
    this.http.post('/api/auth/recuperar', { email: this.email }).subscribe({
      next: () => {
        this.paso = 2;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al enviar el código';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarYCambiar() {
    if (!this.codigo) { this.error = 'Ingrese el código'; return; }
    if (!this.nuevaPassword) { this.error = 'Ingrese la nueva contraseña'; return; }
    if (this.nuevaPassword !== this.confirmarPassword) { this.error = 'Las contraseñas no coinciden'; return; }
    this.cargando = true;
    this.error = '';
    this.http.post('/api/auth/recuperar/verificar', {
      email: this.email,
      codigo: this.codigo,
      password: this.nuevaPassword
    }).subscribe({
      next: () => {
        this.paso = 3;
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Código inválido o expirado';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}