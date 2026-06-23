import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  usuario: string = '';
  contrasena: string = '';
  errorMessage: string = '';
  mostrarContrasena: boolean = false;
  cargando: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  toggleContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  iniciarSesion(): void {
    if (!this.usuario || !this.contrasena) {
      this.errorMessage = 'Complete usuario y contraseña.';
      return;
    }
    this.cargando = true;
    this.errorMessage = '';
    this.authService.login({ username: this.usuario, password: this.contrasena })
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: (res) => {
          this.authService.guardarSesion(res);
          this.router.navigate([res.ruta]);
        },
        error: (err) => {
          this.errorMessage = err.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : 'Error de conexión con el servidor.';
        }
      });
  }

  volverInicio(): void {
    this.router.navigate(['/']);
  }
  irARecuperar(): void {
  this.router.navigate(['/recuperar-contrasena']);
}
}
