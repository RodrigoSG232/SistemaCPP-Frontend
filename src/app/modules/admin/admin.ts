import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminResumen,
  AdminRol,
  AdminService,
  AdminUsuario,
  AdminUsuarioPayload,
  ProductividadReporte
} from '../../services/admin.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  @ViewChild('trendCanvas') trendCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('psychologistCanvas') psychologistCanvas?: ElementRef<HTMLCanvasElement>;
  resumen: AdminResumen | null = null;
  roles: AdminRol[] = [];
  usuarios: AdminUsuario[] = [];

  filtro = '';
  cargandoResumen = false;
  cargandoRoles = false;
  cargandoUsuarios = false;
  guardando = false;
  errorDatos = '';
  errorFormulario = '';
  errorProductividad = '';
  mensaje = '';
  editandoId: number | null = null;
  productividad: ProductividadReporte | null = null;
  desde = this.fechaInput(new Date(Date.now() - 29 * 86400000));
  hasta = this.fechaInput(new Date());
  cargandoProductividad = false;
  private trendChart?: { destroy(): void };
  private psychologistChart?: { destroy(): void };

  form: AdminUsuarioPayload = this.formVacio();

  constructor(private adminService: AdminService) {}

  get cargando(): boolean {
    return this.cargandoResumen || this.cargandoRoles || this.cargandoUsuarios;
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarProductividad();
  }

  ngOnDestroy(): void { this.destruirGraficos(); }

  cargarDatos(): void {
    this.cargandoResumen = true;
    this.cargandoRoles = true;
    this.errorDatos = '';

    this.adminService.getResumen().subscribe({
      next: (resumen) => {
        this.resumen = resumen;
        this.cargandoResumen = false;
      },
      error: (err) => {
        this.cargandoResumen = false;
        this.errorDatos = err.error?.error || 'No se pudo cargar el resumen administrativo.';
      }
    });

    this.adminService.listarRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.cargandoRoles = false;
      },
      error: (err) => {
        this.cargandoRoles = false;
        this.errorDatos = err.error?.error || 'No se pudieron cargar los roles.';
      }
    });

    this.cargarUsuarios(true);
  }

  cargarUsuarios(inicial = false): void {
    this.cargandoUsuarios = true;
    if (!inicial) this.errorDatos = '';
    this.adminService.listarUsuarios(this.filtro).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        this.errorDatos = err.error?.error || 'No se pudieron cargar los usuarios.';
        this.cargandoUsuarios = false;
      }
    });
  }

  cargarProductividad(): void {
    this.errorProductividad = '';
    if (!this.desde || !this.hasta || this.desde > this.hasta) {
      this.errorProductividad = 'Seleccione un periodo válido para productividad.';
      return;
    }
    this.cargandoProductividad = true;
    this.adminService.getProductividad(this.desde, this.hasta).subscribe({
      next: reporte => {
        this.productividad = reporte;
        this.cargandoProductividad = false;
        setTimeout(() => void this.renderizarGraficos());
      },
      error: err => {
        this.cargandoProductividad = false;
        this.errorProductividad = err.error?.error || 'No se pudieron cargar las métricas de productividad.';
      }
    });
  }

  private async renderizarGraficos(): Promise<void> {
    if (!this.productividad) return;
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    this.destruirGraficos();
    if (this.trendCanvas) this.trendChart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.productividad.dailyTrend.map(item => item.date),
        datasets: [
          { label: 'Horas promedio', data: this.productividad.dailyTrend.map(item => item.averageHours), borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,.15)', tension: .3, fill: true },
          { label: 'Altas', data: this.productividad.dailyTrend.map(item => item.discharges), borderColor: '#2563eb', backgroundColor: '#2563eb', tension: .3, yAxisID: 'yDischarges' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Horas' } }, yDischarges: { beginAtZero: true, position: 'right', ticks: { precision: 0 }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Altas' } } } }
    });
    if (this.psychologistCanvas) this.psychologistChart = new Chart(this.psychologistCanvas.nativeElement, {
      type: 'bar',
      data: { labels: this.productividad.byPsychologist.map(item => item.psychologistName), datasets: [{ label: 'Horas promedio hasta el alta', data: this.productividad.byPsychologist.map(item => item.averageHours), backgroundColor: '#14b8a6' }] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });
  }

  private destruirGraficos(): void { this.trendChart?.destroy(); this.psychologistChart?.destroy(); this.trendChart = undefined; this.psychologistChart = undefined; }

  private fechaInput(fecha: Date): string {
    const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  guardarUsuario(): void {
    this.errorFormulario = '';
    this.mensaje = '';

    if (!this.form.username.trim() || !this.form.nombreCompleto.trim() || !this.form.email.trim() || !this.form.rolId) {
      this.errorFormulario = 'Complete usuario, nombre, correo electrónico y rol.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
      this.errorFormulario = 'Ingrese un correo electrónico válido.';
      return;
    }

    if (!this.editandoId && !this.form.password?.trim()) {
      this.errorFormulario = 'La contraseña es obligatoria para usuarios nuevos.';
      return;
    }

    if (this.form.password?.trim() && !this.passwordValida(this.form.password.trim())) {
      this.errorFormulario = 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
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
        this.errorFormulario = err.error?.error || 'No se pudo guardar el usuario.';
      }
    });
  }

  editarUsuario(usuario: AdminUsuario): void {
    this.editandoId = usuario.id;
    this.mensaje = '';
    this.errorFormulario = '';
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
    this.errorFormulario = '';
  }

  cambiarEstado(usuario: AdminUsuario): void {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Confirma que desea ${accion} al usuario ${usuario.username}?`)) return;

    this.errorDatos = '';
    this.mensaje = '';
    this.adminService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
      next: () => {
        this.mensaje = usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.';
        this.cargarDatos();
      },
      error: (err) => this.errorDatos = err.error?.error || 'No se pudo cambiar el estado.'
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

  private passwordValida(password: string): boolean {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }
}
