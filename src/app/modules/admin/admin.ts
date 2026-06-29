import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminResumen,
  AdminRol,
  AdminService,
  AdminUsuario,
  AdminUsuarioPayload
} from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  resumen: AdminResumen | null = null;
  roles: AdminRol[] = [];
  usuarios: AdminUsuario[] = [];

  filtro = '';
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';
  editandoId: number | null = null;

  form: AdminUsuarioPayload = this.formVacio();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    this.adminService.getResumen().subscribe({
      next: (resumen) => this.resumen = resumen
    });

    this.adminService.listarRoles().subscribe({
      next: (roles) => this.roles = roles,
      error: () => this.error = 'No se pudieron cargar los roles.'
    });

    this.cargarUsuarios(true);
  }

  cargarUsuarios(inicial = false): void {
    if (!inicial) {
      this.cargando = true;
    }
    this.adminService.listarUsuarios(this.filtro).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'No se pudieron cargar los usuarios.';
        this.cargando = false;
      }
    });
  }

  guardarUsuario(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.form.username.trim() || !this.form.nombreCompleto.trim() || !this.form.email.trim() || !this.form.rolId) {
      this.error = 'Complete username, nombre, email y rol.';
      return;
    }

    if (!this.editandoId && !this.form.password?.trim()) {
      this.error = 'La contraseña es obligatoria para usuarios nuevos.';
      return;
    }

    this.guardando = true;
    const payload: AdminUsuarioPayload = {
      ...this.form,
      username: this.form.username.trim(),
      nombreCompleto: this.form.nombreCompleto.trim(),
      email: this.form.email.trim(),
      password: this.form.password?.trim() || undefined
    };

    const request = this.editandoId
      ? this.adminService.actualizarUsuario(this.editandoId, payload)
      : this.adminService.crearUsuario(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.editandoId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.';
        this.nuevoUsuario();
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.error || 'No se pudo guardar el usuario.';
      }
    });
  }

  editarUsuario(usuario: AdminUsuario): void {
    this.editandoId = usuario.id;
    this.mensaje = '';
    this.error = '';
    this.form = {
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      rolId: usuario.rolId,
      activo: usuario.activo,
      password: ''
    };
  }

  nuevoUsuario(): void {
    this.editandoId = null;
    this.form = this.formVacio();
  }

  cambiarEstado(usuario: AdminUsuario): void {
    this.error = '';
    this.mensaje = '';
    this.adminService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
      next: () => {
        this.mensaje = usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.';
        this.cargarDatos();
      },
      error: (err) => this.error = err.error?.error || 'No se pudo cambiar el estado.'
    });
  }

  rolDescripcion(rolNombre: string): string {
    const rol = this.roles.find(r => r.nombre === rolNombre);
    return rol?.descripcion || rolNombre;
  }

  private formVacio(): AdminUsuarioPayload {
    return {
      username: '',
      nombreCompleto: '',
      email: '',
      rolId: null,
      activo: true,
      password: ''
    };
  }
}
