import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  usuario: string = '';
  contrasena: string = '';
  mostrarContrasena: boolean = false;
  cargando: boolean = false;

  toggleContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  iniciarSesion(): void {
    if (!this.usuario || !this.contrasena) return;
    this.cargando = true;

    // Aquí va tu lógica de autenticación
    setTimeout(() => {
      this.cargando = false;
      console.log('Iniciando sesión con:', this.usuario);
    }, 1500);
  }
}
