import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PsicologiaService } from '../../services/psicologia.service';
import { Subscription } from 'rxjs';
import { TurnoNotificacion, TurnoWebsocketService } from '../../services/turno-websocket.service';
import { EntrevistaInicialInput, ProcesoTerapeutico } from '../../models/proceso-terapeutico.model';

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
export class Psicologia implements OnInit, OnDestroy {

  fechaSeleccionada = new Date().toISOString().split('T')[0];
  agenda: any = null;
  citas: any[] = [];
  loadingAgenda = false;

  citaActiva: any = null;
  proceso: ProcesoTerapeutico | null = null;
  sesiones: any[] = [];

  motivoConsulta = '';
  observacionesClinicas = '';
  resultadoHipotesis = '';
  indicaciones = '';
  faseSeleccionada = 1;
  guardandoSesion = false;
  mensajeSesion = '';
  errorSesion = '';

  mostrarHistorial = false;
  alertaPacienteListo: TurnoNotificacion | null = null;

  fases = FASES;
  fasesKeys = [1, 2, 3, 4];
  private alertaTimeout: any;
  private turnoSubscription?: Subscription;

  constructor(
    private psicologiaService: PsicologiaService,
    private turnoWebsocketService: TurnoWebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAgenda();
    this.turnoSubscription = this.turnoWebsocketService.turno$.subscribe((turno) => {
      this.mostrarAlertaPacienteListo(turno);
    });
  }

  ngOnDestroy() {
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }

    this.turnoSubscription?.unsubscribe();
    this.turnoWebsocketService.desconectar();
  }

  cargarAgenda(silencioso = false) {
    if (!silencioso) {
      this.loadingAgenda = true;
      this.cdr.detectChanges();
    }

    this.psicologiaService.getAgenda(this.fechaSeleccionada).subscribe({
      next: (res) => {
        this.agenda = res;
        this.citas = res.citas || [];
        this.loadingAgenda = false;
        if (res.psicologoId) {
          this.turnoWebsocketService.conectarPacientesListos(res.psicologoId);
        }
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
    this.motivoConsulta = '';
    this.observacionesClinicas = '';
    this.resultadoHipotesis = '';
    this.indicaciones = '';
    this.mensajeSesion = '';
    this.errorSesion = '';
    this.mostrarHistorial = false;
    this.cargarProceso(cita.pacienteId);
    this.cdr.detectChanges();
  }

  llamarPaciente(cita: any) {
    this.psicologiaService.cambiarEstadoCita(cita.id, 'EN_CONSULTA').subscribe({
      next: (citaActualizada) => {
        this.citas = this.citas.map(item => item.id === citaActualizada.id ? citaActualizada : item);
        this.seleccionarCita(citaActualizada);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorSesion = err.error?.error || 'No se pudo llamar al paciente.';
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

  actualizarFase() {
    if (!this.proceso) return;
    this.psicologiaService.actualizarFase(this.proceso.id, this.faseSeleccionada).subscribe({
      next: (proc) => {
        this.proceso = proc;
        this.errorSesion = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorSesion = err.error?.error || 'No se pudo actualizar la fase del proceso.';
        this.cdr.detectChanges();
      }
    });
  }

  get faseInfo() {
    return FASES[this.faseSeleccionada] || FASES[1];
  }

  // Despachador: el mismo formulario sirve para crear el proceso (sin proceso
  // activo todavía, equivale a la entrevista inicial) o para registrar una
  // sesión normal (con proceso ya activo). La rama se decide acá, no en el
  // template — la plantilla solo refleja el resultado.
  guardarFormularioClinico() {
    if (!this.motivoConsulta.trim()) {
      this.errorSesion = 'El motivo de consulta es obligatorio.';
      return;
    }

    if (!this.proceso) {
      this.crearProcesoConEntrevista();
    } else {
      this.crearSesion(this.proceso);
    }
  }

  private crearProcesoConEntrevista() {
    this.guardandoSesion = true;
    this.errorSesion = '';
    this.cdr.detectChanges();

    const entrevista: EntrevistaInicialInput = {
      motivoConsulta: this.motivoConsulta,
      antecedentesPersonales: this.observacionesClinicas.trim() || null,
      antecedentesFamiliares: null,
      observacionesIniciales: this.resultadoHipotesis.trim() || null
    };

    this.psicologiaService.iniciarProceso(this.citaActiva.pacienteId, this.citaActiva.id, entrevista).subscribe({
      next: (proc) => {
        this.proceso = proc;
        this.faseSeleccionada = proc.faseActual;
        this.citaActiva.estado = 'ATENDIDA';
        this.guardandoSesion = false;
        this.mensajeSesion = 'Entrevista inicial registrada. Proceso terapéutico iniciado.';
        this.motivoConsulta = '';
        this.observacionesClinicas = '';
        this.resultadoHipotesis = '';
        this.psicologiaService.getSesionesPorProceso(proc.id).subscribe({
          next: (s) => {
            this.sesiones = s;
            this.cdr.detectChanges();
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoSesion = false;
        this.errorSesion = err.error?.error || 'Error al iniciar el proceso terapéutico.';
        this.cdr.detectChanges();
      }
    });
  }

  private crearSesion(proceso: ProcesoTerapeutico) {
    this.guardandoSesion = true;
    this.errorSesion = '';
    this.cdr.detectChanges();

    this.psicologiaService.registrarSesion({
      citaId: this.citaActiva.id,
      procesoId: proceso.id,
      evolucion: this.formatearEvolucion(),
      indicaciones: this.indicaciones,
      faseSesion: this.faseSeleccionada
    }).subscribe({
      next: () => {
        this.guardandoSesion = false;
        this.mensajeSesion = 'Sesión guardada correctamente.';
        this.citaActiva.estado = 'ATENDIDA';
        this.motivoConsulta = '';
        this.observacionesClinicas = '';
        this.resultadoHipotesis = '';
        this.indicaciones = '';
        this.psicologiaService.getSesionesPorProceso(proceso.id).subscribe({
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

  // Sesion.evolucion sigue siendo un solo TEXT en el backend; las 3 cajas del
  // formulario se concatenan con etiquetas para no perder lo que se escribió.
  private formatearEvolucion(): string {
    const partes = [`Motivo de consulta: ${this.motivoConsulta}`];
    if (this.observacionesClinicas.trim()) {
      partes.push(`Observaciones clínicas: ${this.observacionesClinicas}`);
    }
    if (this.resultadoHipotesis.trim()) {
      partes.push(`Resultado / hipótesis: ${this.resultadoHipotesis}`);
    }
    return partes.join('\n\n');
  }

  cerrarAlertaPacienteListo() {
    this.alertaPacienteListo = null;
    this.cdr.detectChanges();
  }

  private mostrarAlertaPacienteListo(turno: TurnoNotificacion) {
    if (turno.fecha !== this.fechaSeleccionada) return;

    this.alertaPacienteListo = turno;
    this.cargarAgenda(true);

    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }

    this.alertaTimeout = setTimeout(() => {
      this.alertaPacienteListo = null;
      this.cdr.detectChanges();
    }, 12000);

    this.cdr.detectChanges();
  }
}
