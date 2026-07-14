import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PsicologiaService } from '../../services/psicologia.service';
import { map, Observable, of, Subscription, switchMap } from 'rxjs';
import { TurnoNotificacion, TurnoWebsocketService } from '../../services/turno-websocket.service';
import { EntrevistaInicialInput } from '../../models/proceso-terapeutico.model';
import { DiagnosticoCie10, HipotesisClinica, ProcesoClinico } from '../../models/diagnostico.model';
import { SesionClinica } from '../../models/sesion-clinica.model';
import { InformeAlta } from '../../models/alta-clinica.model';

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

  fechaSeleccionada = this.toLocalDateInputValue(new Date());
  agenda: any = null;
  citas: any[] = [];
  loadingAgenda = false;
  errorAgenda = '';

  citaActiva: any = null;
  proceso: ProcesoClinico | null = null;
  procesoClinico: ProcesoClinico | null = null;
  sesionesClinicas: SesionClinica[] = [];

  motivoConsulta = '';
  observacionesClinicas = '';
  resultadoHipotesis = '';
  indicaciones = '';
  faseSeleccionada = 1;
  guardandoSesion = false;
  mensajeSesion = '';
  errorSesion = '';
  busquedaCie10 = '';
  resultadosCie10: DiagnosticoCie10[] = [];
  diagnosticosSeleccionados: DiagnosticoCie10[] = [];
  hipotesisFase2 = '';
  planTerapeutico = '';
  hipotesisRegistradas: HipotesisClinica[] = [];
  buscandoCie10 = false;
  guardandoHipotesis = false;
  motivoAlta = '';
  resumenTratamiento = '';
  logrosAlta = '';
  recomendacionesAlta = '';
  informeAlta: InformeAlta | null = null;
  guardandoAlta = false;

  mostrarHistorial = false;
  alertaPacienteListo: TurnoNotificacion | null = null;

  fases = FASES;
  fasesKeys = [1, 2, 3, 4];
  private alertaTimeout: any;
  private agendaInterval: any;
  private turnoSubscription?: Subscription;
  private pacientesListosNotificados = new Set<number>();
  private cie10Timeout: any;

  constructor(
    private psicologiaService: PsicologiaService,
    private turnoWebsocketService: TurnoWebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAgenda();
    this.agendaInterval = setInterval(() => {
      this.cargarAgenda(true);
    }, 5000);
    this.turnoSubscription = this.turnoWebsocketService.turno$.subscribe((turno) => {
      this.mostrarAlertaPacienteListo(turno);
    });
  }

  ngOnDestroy() {
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }
    if (this.agendaInterval) {
      clearInterval(this.agendaInterval);
    }

    this.turnoSubscription?.unsubscribe();
    if (this.cie10Timeout) clearTimeout(this.cie10Timeout);
    this.turnoWebsocketService.desconectar();
  }

  cargarAgenda(silencioso = false) {
    if (!silencioso) {
      this.loadingAgenda = true;
      this.errorAgenda = '';
      this.cdr.detectChanges();
    }

    this.psicologiaService.getAgenda(this.fechaSeleccionada).subscribe({
      next: (res) => {
        if (!res?.psicologoId) {
          this.limpiarAgendaPorError('No se pudo identificar al psicólogo autenticado.');
          return;
        }

        const citasActualizadas = (res.citas || []).filter((cita: any) =>
          this.esCitaDelPsicologo(cita, res.psicologoId)
        );
        const agendaActualizada = { ...res, citas: citasActualizadas };

        this.agenda = agendaActualizada;
        this.citas = citasActualizadas;
        this.loadingAgenda = false;
        this.errorAgenda = '';
        this.turnoWebsocketService.conectarPacientesListos(res.psicologoId);

        if (silencioso) {
          this.notificarPacientesListosDetectados(citasActualizadas, agendaActualizada);
        }

        this.sincronizarCitaActiva();
        this.registrarPacientesListosVistos(this.citas);
        this.cdr.detectChanges();
      },
      error: () => {
        this.limpiarAgendaPorError('No se pudo cargar la agenda del psicólogo autenticado.');
      }
    });
  }

  onFechaChange() {
    this.citaActiva = null;
    this.proceso = null;
    this.pacientesListosNotificados.clear();
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
    this.limpiarFase2();
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
    this.procesoClinico = null;
    this.sesionesClinicas = [];
    this.informeAlta = null;
    this.cargarProcesoClinico(pacienteId);
    this.cdr.detectChanges();
  }

  actualizarFase() {
    if (!this.procesoClinico) return;
    this.psicologiaService.actualizarFaseClinica(this.procesoClinico.id, this.faseSeleccionada).subscribe({
      next: (procesoClinico) => {
        this.proceso = procesoClinico;
        this.procesoClinico = procesoClinico;
        this.errorSesion = '';
        if (procesoClinico.currentPhase === 2) this.cargarHipotesis(procesoClinico.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorSesion = err.error?.error || 'No se pudo sincronizar la fase del proceso clínico.';
        this.cdr.detectChanges();
      }
    });
  }

  buscarCie10() {
    if (this.cie10Timeout) clearTimeout(this.cie10Timeout);
    const query = this.busquedaCie10.trim();
    if (query.length < 2) {
      this.resultadosCie10 = [];
      return;
    }
    this.cie10Timeout = setTimeout(() => {
      this.buscandoCie10 = true;
      this.psicologiaService.buscarDiagnosticosCie10(query).subscribe({
        next: resultados => {
          const selected = new Set(this.diagnosticosSeleccionados.map(d => d.code));
          this.resultadosCie10 = resultados.filter(d => !selected.has(d.code));
          this.buscandoCie10 = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.buscandoCie10 = false;
          this.errorSesion = 'No se pudo consultar el catálogo CIE-10.';
          this.cdr.detectChanges();
        }
      });
    }, 300);
  }

  seleccionarDiagnostico(diagnostico: DiagnosticoCie10) {
    if (!this.diagnosticosSeleccionados.some(d => d.code === diagnostico.code)) {
      this.diagnosticosSeleccionados = [...this.diagnosticosSeleccionados, diagnostico];
    }
    this.resultadosCie10 = this.resultadosCie10.filter(d => d.code !== diagnostico.code);
  }

  quitarDiagnostico(code: string) {
    this.diagnosticosSeleccionados = this.diagnosticosSeleccionados.filter(d => d.code !== code);
  }

  guardarHipotesisPlan() {
    if (!this.procesoClinico || this.procesoClinico.currentPhase !== 2) {
      this.errorSesion = 'El paciente no tiene un proceso en Fase 2 dentro del microservicio clínico.';
      return;
    }
    if (!this.hipotesisFase2.trim() || !this.planTerapeutico.trim() || this.diagnosticosSeleccionados.length === 0) {
      this.errorSesion = 'Registre la hipótesis, el plan y al menos un diagnóstico CIE-10.';
      return;
    }
    this.guardandoHipotesis = true;
    this.errorSesion = '';
    this.psicologiaService.registrarHipotesis(this.procesoClinico.id, {
      hypothesis: this.hipotesisFase2.trim(),
      therapeuticPlan: this.planTerapeutico.trim(),
      diagnosisCodes: this.diagnosticosSeleccionados.map(d => d.code),
      registeredBy: this.agenda?.nombreCompleto || 'Psicólogo responsable'
    }).subscribe({
      next: registro => {
        this.hipotesisRegistradas = [registro, ...this.hipotesisRegistradas];
        this.hipotesisFase2 = '';
        this.planTerapeutico = '';
        this.diagnosticosSeleccionados = [];
        this.busquedaCie10 = '';
        this.resultadosCie10 = [];
        this.guardandoHipotesis = false;
        this.mensajeSesion = 'Hipótesis, plan y diagnósticos CIE-10 registrados.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.guardandoHipotesis = false;
        this.errorSesion = err.error?.error || 'No se pudo registrar la hipótesis clínica.';
        this.cdr.detectChanges();
      }
    });
  }

  private cargarProcesoClinico(pacienteId: number) {
    this.psicologiaService.getProcesoClinicoActivo(pacienteId).subscribe({
      next: proceso => {
        this.proceso = proceso;
        this.procesoClinico = proceso;
        this.faseSeleccionada = proceso.currentPhase;
        this.cargarSesionesClinicas(proceso.id);
        if (proceso.currentPhase === 2) this.cargarHipotesis(proceso.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.proceso = null;
        this.procesoClinico = null;
        this.sesionesClinicas = [];
        this.hipotesisRegistradas = [];
        this.cargarUltimoInformeAlta(pacienteId);
        this.cdr.detectChanges();
      }
    });
  }

  private cargarUltimoInformeAlta(pacienteId: number) {
    this.psicologiaService.getUltimoInformeAlta(pacienteId).subscribe({
      next: informe => {
        this.informeAlta = informe;
        this.cdr.detectChanges();
      },
      error: () => { this.informeAlta = null; this.cdr.detectChanges(); }
    });
  }

  private cargarSesionesClinicas(procesoId: number) {
    this.psicologiaService.getSesionesClinicas(procesoId).subscribe({
      next: sesiones => {
        this.sesionesClinicas = sesiones;
        this.cdr.detectChanges();
      },
      error: () => {
        this.sesionesClinicas = [];
        this.cdr.detectChanges();
      }
    });
  }

  private cargarHipotesis(procesoId: number) {
    this.psicologiaService.getHipotesis(procesoId).subscribe({
      next: registros => { this.hipotesisRegistradas = registros; this.cdr.detectChanges(); },
      error: () => { this.hipotesisRegistradas = []; this.cdr.detectChanges(); }
    });
  }

  private limpiarFase2() {
    this.busquedaCie10 = '';
    this.resultadosCie10 = [];
    this.diagnosticosSeleccionados = [];
    this.hipotesisFase2 = '';
    this.planTerapeutico = '';
    this.hipotesisRegistradas = [];
  }

  registrarAltaMedica() {
    if (!this.procesoClinico || this.procesoClinico.currentPhase !== 4 || !this.procesoClinico.active) {
      this.errorSesion = 'El alta médica requiere un proceso clínico activo en Fase 4.';
      return;
    }
    if (![this.motivoAlta, this.resumenTratamiento, this.logrosAlta, this.recomendacionesAlta].every(value => value.trim())) {
      this.errorSesion = 'Complete todos los campos del informe de alta.';
      return;
    }
    if (!window.confirm('¿Confirma el alta médica? Después de registrarla la historia clínica quedará bloqueada.')) return;
    this.guardandoAlta = true;
    this.errorSesion = '';
    this.psicologiaService.registrarAlta(this.procesoClinico.id, {
      dischargeReason: this.motivoAlta.trim(),
      treatmentSummary: this.resumenTratamiento.trim(),
      achievements: this.logrosAlta.trim(),
      recommendations: this.recomendacionesAlta.trim(),
      registeredBy: this.agenda?.nombreCompleto || 'Psicólogo responsable'
    }).subscribe({
      next: (informe) => {
        this.informeAlta = informe;
        this.procesoClinico = { ...this.procesoClinico!, active: false, status: 'ALTA' };
        this.proceso = this.procesoClinico;
        this.guardandoAlta = false;
        this.mensajeSesion = 'Alta médica registrada. La historia clínica quedó bloqueada.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.guardandoAlta = false;
        this.errorSesion = err.error?.error || 'No se pudo registrar el alta médica.';
        this.cdr.detectChanges();
      }
    });
  }

  async descargarInformeAltaPdf() {
    if (!this.informeAlta) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const informe = this.informeAlta;
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('INFORME DE FINALIZACIÓN Y ALTA', 105, 17, { align: 'center' });
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Paciente: ${informe.patientName}`, 15, 38);
    doc.text(`DNI: ${informe.patientDni}   HC: ${informe.patientHistoryNumber}`, 15, 44);
    doc.text(`Psicólogo: ${informe.psychologistName}`, 15, 50);
    doc.text(`Tratamiento: ${informe.treatmentStartDate} al ${informe.treatmentEndDate}`, 15, 56);
    doc.text(`Duración: ${informe.treatmentDays} días   Sesiones: ${informe.sessionCount}`, 15, 62);
    let y = 72;
    const section = (title: string, value: string) => {
      doc.setFont('helvetica', 'bold'); doc.text(title, 15, y); y += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(value, 180); doc.text(lines, 15, y); y += lines.length * 5 + 5;
      if (y > 270) { doc.addPage(); y = 20; }
    };
    section('Motivo de alta', informe.dischargeReason);
    section('Resumen del tratamiento', informe.treatmentSummary);
    section('Logros alcanzados', informe.achievements);
    section('Recomendaciones', informe.recommendations);
    doc.setFont('helvetica', 'bold');
    doc.text(`Responsable: ${informe.registeredBy}`, 15, y + 3);
    doc.save(`informe-alta-${informe.patientHistoryNumber}.pdf`);
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

    this.psicologiaService.asegurarTicketVinculado(this.citaActiva.id, this.citaActiva.pacienteId).pipe(
      switchMap(() => this.asegurarProcesoClinico(entrevista)),
      switchMap(procesoClinico => this.psicologiaService.cambiarEstadoCita(this.citaActiva.id, 'ATENDIDA').pipe(
        map(() => procesoClinico)
      ))
    ).subscribe({
      next: (procesoClinico) => {
        this.proceso = procesoClinico;
        this.procesoClinico = procesoClinico;
        this.faseSeleccionada = procesoClinico.currentPhase;
        this.citaActiva.estado = 'ATENDIDA';
        this.guardandoSesion = false;
        this.mensajeSesion = 'Entrevista inicial registrada. Proceso terapéutico iniciado.';
        this.motivoConsulta = '';
        this.observacionesClinicas = '';
        this.resultadoHipotesis = '';
        this.cargarSesionesClinicas(procesoClinico.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoSesion = false;
        this.errorSesion = err.error?.error || 'Error al iniciar el proceso terapéutico.';
        this.cdr.detectChanges();
      }
    });
  }

  private crearSesion(proceso: ProcesoClinico) {
    this.guardandoSesion = true;
    this.errorSesion = '';
    this.cdr.detectChanges();

    const evolucion = this.formatearEvolucion();
    const entrevistaPuente: EntrevistaInicialInput = {
      motivoConsulta: this.motivoConsulta,
      antecedentesPersonales: this.observacionesClinicas.trim() || null,
      antecedentesFamiliares: null,
      observacionesIniciales: this.resultadoHipotesis.trim() || null
    };
    this.psicologiaService.asegurarTicketVinculado(this.citaActiva.id, this.citaActiva.pacienteId).pipe(
      switchMap(() => this.asegurarProcesoClinico(entrevistaPuente)),
      switchMap(procesoClinico => this.psicologiaService.registrarSesionClinicaExterna({
        processId: procesoClinico.id,
        appointmentId: this.citaActiva.id,
        sessionPhase: this.faseSeleccionada,
        evolution: evolucion,
        patientIndications: this.indicaciones,
        registeredBy: this.agenda?.nombreCompleto || 'Psicólogo responsable'
      }).pipe(map(() => procesoClinico))),
      switchMap(procesoClinico => this.psicologiaService.cambiarEstadoCita(this.citaActiva.id, 'ATENDIDA').pipe(
        map(() => procesoClinico)
      ))
    ).subscribe({
      next: (procesoClinico) => {
        this.procesoClinico = procesoClinico;
        this.guardandoSesion = false;
        this.mensajeSesion = 'Sesión guardada correctamente.';
        this.citaActiva.estado = 'ATENDIDA';
        this.motivoConsulta = '';
        this.observacionesClinicas = '';
        this.resultadoHipotesis = '';
        this.indicaciones = '';
        this.cargarSesionesClinicas(procesoClinico.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoSesion = false;
        this.errorSesion = err.error?.error || 'Error al guardar la sesión.';
        this.cdr.detectChanges();
      }
    });
  }

  private asegurarProcesoClinico(entrevista: EntrevistaInicialInput): Observable<ProcesoClinico> {
    if (this.procesoClinico) return of(this.procesoClinico);
    return this.psicologiaService.iniciarProcesoClinicoExterno(this.citaActiva.pacienteId, {
      appointmentId: this.citaActiva.id,
      psychologistId: this.agenda?.psicologoId,
      psychologistName: this.agenda?.nombreCompleto || 'Psicólogo responsable',
      patientName: this.citaActiva.paciente,
      patientDni: this.citaActiva.pacienteDni,
      patientHistoryNumber: this.citaActiva.pacienteHc,
      observaciones: this.observacionesClinicas.trim() || null,
      entrevista
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
    if (!this.agenda?.psicologoId || Number(turno.psicologoId) !== Number(this.agenda.psicologoId)) return;
    if (turno.fecha !== this.fechaSeleccionada) return;

    this.pacientesListosNotificados.add(turno.citaId);
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

  private toLocalDateInputValue(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private sincronizarCitaActiva(): void {
    if (this.citaActiva) {
      const actualizada = this.citas.find(c => c.id === this.citaActiva.id);
      if (actualizada) {
        this.citaActiva = { ...this.citaActiva, ...actualizada };
      }
      return;
    }

    const activa = this.citas.find(c => c.estado === 'EN_CONSULTA');
    if (activa) {
      this.seleccionarCita(activa);
    }
  }

  private registrarPacientesListosVistos(citas: any[]): void {
    citas
      .filter(cita => this.esCitaDelPsicologo(cita, this.agenda?.psicologoId) && cita.estado === 'EN_PISO')
      .forEach(cita => this.pacientesListosNotificados.add(cita.id));
  }

  private notificarPacientesListosDetectados(citas: any[], agenda: any): void {
    const nuevaCitaLista = citas.find(cita =>
      this.esCitaDelPsicologo(cita, agenda?.psicologoId)
      && cita.estado === 'EN_PISO'
      && !this.pacientesListosNotificados.has(cita.id)
    );

    if (!nuevaCitaLista) return;

    this.mostrarAlertaPacienteListo({
      citaId: nuevaCitaLista.id,
      pacienteId: nuevaCitaLista.pacienteId,
      paciente: nuevaCitaLista.paciente,
      pacienteDni: nuevaCitaLista.pacienteDni,
      pacienteHc: nuevaCitaLista.pacienteHc,
      psicologoId: agenda.psicologoId,
      psicologo: agenda.nombreCompleto,
      especialidad: nuevaCitaLista.especialidad,
      fecha: nuevaCitaLista.fecha,
      hora: nuevaCitaLista.hora,
      estado: nuevaCitaLista.estado,
      ticketNumero: null,
      mensaje: 'Paciente detectado en piso'
    });
  }

  private esCitaDelPsicologo(cita: any, psicologoId: number | null | undefined): boolean {
    return psicologoId != null
      && cita?.psicologoId != null
      && Number(cita.psicologoId) === Number(psicologoId);
  }

  private limpiarAgendaPorError(mensaje: string): void {
    this.loadingAgenda = false;
    this.errorAgenda = mensaje;
    this.agenda = null;
    this.citas = [];
    this.citaActiva = null;
    this.proceso = null;
    this.procesoClinico = null;
    this.sesionesClinicas = [];
    this.alertaPacienteListo = null;
    this.pacientesListosNotificados.clear();

    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
      this.alertaTimeout = null;
    }

    this.turnoWebsocketService.desconectar();
    this.cdr.detectChanges();
  }
}
