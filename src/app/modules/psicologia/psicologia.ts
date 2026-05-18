import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PsicologiaService } from '../../services/psicologia.service';

const FASES: Record<number, { nombre: string; descripcion: string }> = {
  1: { nombre: 'Fase 1: Evaluación', descripcion: 'Se realiza la evaluación inicial del paciente, recabando información clínica relevante.' },
  2: { nombre: 'Fase 2: Explicación de Hipótesis', descripcion: 'Se explican los resultados de la evaluación y se establecen los objetivos terapéuticos en conjunto.' },
  3: { nombre: 'Fase 3: Tratamiento', descripcion: 'Se aplican las técnicas y estrategias terapéuticas acordadas para abordar la problemática.' },
  4: { nombre: 'Fase 4: Seguimiento', descripcion: 'Se monitorea el progreso del paciente y se refuerzan los logros obtenidos.' }
};

@Component({
  selector: 'app-psicologia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './psicologia.html',
  styleUrl: './psicologia.css'
})
export class Psicologia implements OnInit {

  fechaSeleccionada = new Date().toISOString().split('T')[0];
  agenda: any = null;
  citas: any[] = [];
  loadingAgenda = false;

  citaActiva: any = null;
  proceso: any = null;
  sesiones: any[] = [];

  evolucion = '';
  indicaciones = '';
  faseSeleccionada = 1;
  guardandoSesion = false;
  mensajeSesion = '';
  errorSesion = '';

  mostrarHistorial = false;
  iniciandoProceso = false;

  fases = FASES;
  fasesKeys = [1, 2, 3, 4];

  constructor(
    private psicologiaService: PsicologiaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAgenda();
  }

  cargarAgenda() {
    this.loadingAgenda = true;
    this.cdr.detectChanges();

    this.psicologiaService.getAgenda(this.fechaSeleccionada).subscribe({
      next: (res) => {
        this.agenda = res;
        this.citas = res.citas || [];
        this.loadingAgenda = false;
        const activa = this.citas.find(c => c.estado === 'EN_CONSULTA');
        if (activa) this.seleccionarCita(activa);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAgenda = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFechaChange() {
    this.citaActiva = null;
    this.proceso = null;
    this.cargarAgenda();
  }

  seleccionarCita(cita: any) {
    this.citaActiva = cita;
    this.evolucion = '';
    this.indicaciones = '';
    this.mensajeSesion = '';
    this.errorSesion = '';
    this.mostrarHistorial = false;
    this.cargarProceso(cita.paciente.id);
    this.cdr.detectChanges();
  }

  llamarPaciente(cita: any) {
    this.psicologiaService.cambiarEstadoCita(cita.id, 'EN_CONSULTA').subscribe({
      next: () => {
        cita.estado = 'EN_CONSULTA';
        this.seleccionarCita(cita);
        this.cdr.detectChanges();
      }
    });
  }

  cargarProceso(pacienteId: number) {
    this.proceso = null;
    this.sesiones = [];
    this.cdr.detectChanges();

    this.psicologiaService.getProceso(pacienteId).subscribe({
      next: (proc) => {
        this.proceso = proc;
        this.faseSeleccionada = proc.faseActual;
        this.psicologiaService.getSesionesPorProceso(proc.id).subscribe({
          next: (s) => {
            this.sesiones = s;
            this.cdr.detectChanges();
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404) this.proceso = null;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarProceso() {
    if (!this.citaActiva) return;
    this.iniciandoProceso = true;
    this.cdr.detectChanges();

    this.psicologiaService.iniciarProceso(this.citaActiva.paciente.id).subscribe({
      next: (proc) => {
        this.proceso = proc;
        this.faseSeleccionada = 1;
        this.iniciandoProceso = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.iniciandoProceso = false;
        this.errorSesion = err.error?.error || 'Error al iniciar proceso.';
        this.cdr.detectChanges();
      }
    });
  }

  actualizarFase() {
    if (!this.proceso) return;
    this.psicologiaService.actualizarFase(this.proceso.id, this.faseSeleccionada).subscribe({
      next: (proc) => {
        this.proceso = proc;
        this.cdr.detectChanges();
      }
    });
  }

  get faseInfo() {
    return FASES[this.faseSeleccionada] || FASES[1];
  }

  guardarSesion() {
    if (!this.evolucion.trim()) {
      this.errorSesion = 'La evolución es obligatoria.';
      return;
    }
    if (!this.proceso) {
      this.errorSesion = 'Primero inicie el proceso terapéutico.';
      return;
    }
    this.guardandoSesion = true;
    this.errorSesion = '';
    this.cdr.detectChanges();

    this.psicologiaService.registrarSesion({
      citaId: this.citaActiva.id,
      procesoId: this.proceso.id,
      evolucion: this.evolucion,
      indicaciones: this.indicaciones,
      faseSesion: this.faseSeleccionada
    }).subscribe({
      next: () => {
        this.guardandoSesion = false;
        this.mensajeSesion = 'Sesión guardada correctamente.';
        this.citaActiva.estado = 'ATENDIDA';
        this.evolucion = '';
        this.indicaciones = '';
        this.psicologiaService.getSesionesPorProceso(this.proceso.id).subscribe({
          next: (s) => {
            this.sesiones = s;
            this.cdr.detectChanges();
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoSesion = false;
        this.errorSesion = err.error?.error || 'Error al guardar la sesión.';
        this.cdr.detectChanges();
      }
    });
  }
}