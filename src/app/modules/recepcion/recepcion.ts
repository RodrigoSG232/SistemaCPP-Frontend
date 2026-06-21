import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { RecepcionService } from '../../services/recepcion.service';
import { finalize } from 'rxjs/operators';
import { PacienteRequest, PacienteValidationErrors } from '../../models/paciente.model';
import { TicketResponse } from '../../models/ticket.model';

type Vista = 'inicio' | 'historia' | 'cita' | 'calendario';
type TicketView = Omit<TicketResponse, 'fechaEmision'> & {
  fechaEmision: Date;
  pacienteNombre?: string;
};

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './recepcion.html',
  styleUrl: './recepcion.css'
})
export class Recepcion implements OnInit {

  fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ticketActual: TicketView | null = null;
  colaTickets: TicketView[] = [];
  loadingTickets = false;

  vistaActual: Vista = 'inicio';

  busquedaPaciente = '';
  resultadosBusqueda: any[] = [];
  pacienteSeleccionado: any = null;
  citasPaciente: any[] = [];
  buscando = false;
  
  // Bandera para mostrar el error "No hay resultados" solo después de buscar
  busquedaRealizada = false;

  mostrarFormNuevoPaciente = false;
  pacienteForm: FormGroup;
  guardandoPaciente = false;
  errorPaciente = '';

  especialidades: any[] = [];
  psicologos: any[] = [];
  horasDisponibles: string[] = [];

  // 🟢 ACTUALIZADO: Se agregó el campo 'consultorio' para el nuevo diseño
  cita = {
    pacienteId: null as number | null,
    especialidadId: null as number | null,
    psicologoId: null as number | null,
    fecha: '',
    hora: '',
    consultorio: '', 
    ticketId: null as number | null
  };

  agendando = false;
  mensajeCita = '';
  errorCita = '';
  cargandoCalendario = false;
  errorCalendario = '';
  citaCalendarioSeleccionada: any = null;
  rangoCalendario = {
    inicio: '',
    fin: ''
  };
  calendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: 'es',
    height: 'auto',
    allDaySlot: false,
    nowIndicator: true,
    selectable: true,
    selectMirror: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '19:00:00',
    slotDuration: '01:00:00',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '19:00'
    },
    weekends: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth'
    },
    buttonText: {
      today: 'Hoy',
      week: 'Semana',
      month: 'Mes'
    },
    events: [],
    datesSet: (arg) => this.onCalendarioRango(arg),
    eventClick: (arg) => this.onCitaCalendarioClick(arg),
    select: (arg) => this.onHorarioCalendarioSeleccionado(arg),
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  };

  constructor(
    private recepcionService: RecepcionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.pacienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      fechaNacimiento: ['', [Validators.required, this.fechaNacimientoPasada]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      sexo: ['', [Validators.required]],
      direccion: ['', [Validators.maxLength(250)]]
    });
  }


  fechaMinima = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.cargarTickets();
    // (Se eliminó la escucha reactiva del teclado de aquí)
  }

  cargarTickets() {
    this.loadingTickets = true;
    this.cdr.detectChanges();

    this.recepcionService.listarTickets('ESPERA').subscribe({
      next: (tickets) => {
        this.colaTickets = tickets.map(t => ({
          ...t,
          fechaEmision: new Date(t.fechaEmision)
        }));
        this.loadingTickets = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });

    this.recepcionService.listarTickets('EN_ATENCION').subscribe({
      next: (tickets) => {
        this.ticketActual = tickets[0]
          ? { ...tickets[0], fechaEmision: new Date(tickets[0].fechaEmision) }
          : null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketActual = null;
        this.cdr.detectChanges();
      }
    });
  }

  llamarTicket(ticket: TicketView) {
    if (this.ticketActual) {
      alert('Primero debe finalizar la atención actual antes de llamar otro ticket.');
      return;
    }

    this.llamarTicketDirecto(ticket);
}

  private llamarTicketDirecto(ticket: TicketView) {
    this.recepcionService.cambiarEstadoTicket(ticket.id, 'EN_ATENCION').subscribe({
      next: (ticketActualizado) => {
        this.ticketActual = {
          ...ticketActualizado,
          fechaEmision: new Date(ticketActualizado.fechaEmision)
        };

        this.colaTickets = this.colaTickets.filter(t => t.id !== ticket.id);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('No se pudo llamar el ticket. Intente nuevamente.');
      }
    });
}

  finalizarAtencion() {
    if (!this.ticketActual) return;

    this.recepcionService.cambiarEstadoTicket(this.ticketActual.id, 'FINALIZADO').subscribe({
      next: () => {
        this.ticketActual = null;
        this.cargarTickets();
      },
      error: () => {
        alert('No se pudo finalizar la atención. Intente nuevamente.');
      }
    });
}

  irAHistoria() {
    this.vistaActual = 'historia';
    this.pacienteSeleccionado = null;
    this.resultadosBusqueda = [];
    this.busquedaPaciente = '';
    this.busquedaRealizada = false;
    this.mostrarFormNuevoPaciente = false;
    this.cdr.detectChanges();
  }

  buscarPaciente() {
    // 🟢 LÓGICA MANUAL: Limpiamos si está vacío
    if (!this.busquedaPaciente.trim()) {
      this.resultadosBusqueda = [];
      this.busquedaRealizada = false;
      this.cdr.detectChanges();
      return;
    }

    this.buscando = true;
    this.busquedaRealizada = false; // Ocultamos errores viejos antes de buscar
    this.cdr.detectChanges();

    this.recepcionService.buscarPacientes(this.busquedaPaciente)
      .pipe(finalize(() => {
        this.buscando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.resultadosBusqueda = res;
          this.busquedaRealizada = true; // Solo activamos la bandera al recibir respuesta
          this.cdr.detectChanges();
        }
      });
  }
  

  seleccionarPaciente(p: any) {
    this.pacienteSeleccionado = p;

    this.recepcionService.getCitasPorPaciente(p.id).subscribe({
      next: (citas) => {
        this.citasPaciente = citas;
        this.cdr.detectChanges();
      }
    });
  }

  abrirFormNuevoPaciente() {
    this.mostrarFormNuevoPaciente = true;
    this.errorPaciente = '';
    this.pacienteForm.reset({
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '',
      telefono: '',
      email: '',
      sexo: '',
      direccion: ''
    });
    this.pacienteForm.markAsPristine();
    this.pacienteForm.markAsUntouched();
    this.cdr.detectChanges();
  }

  guardarNuevoPaciente() {
    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.guardandoPaciente = true;
    this.errorPaciente = '';
    this.cdr.detectChanges();

    const request = this.construirPacienteRequest();

    this.recepcionService.crearPaciente(request)
      .pipe(finalize(() => {
        this.guardandoPaciente = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (p) => {
          this.mostrarFormNuevoPaciente = false;
          this.seleccionarPaciente(p);
        },
        error: (err) => {
          this.procesarErroresPaciente(err.error);
          this.cdr.detectChanges();
        }
      });
  }

  campoInvalido(campo: string): boolean {
    const control = this.pacienteForm.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  obtenerErrorCampo(campo: string): string {
    const control = this.pacienteForm.get(campo);
    if (!control || !control.errors) return '';

    if (control.errors['backend']) return control.errors['backend'];

    const mensajes: Record<string, Record<string, string>> = {
      dni: {
        required: 'El DNI es obligatorio',
        pattern: 'El DNI debe tener exactamente 8 dígitos numéricos'
      },
      nombres: {
        required: 'Los nombres son obligatorios',
        maxlength: 'Los nombres no deben superar los 100 caracteres'
      },
      apellidos: {
        required: 'Los apellidos son obligatorios',
        maxlength: 'Los apellidos no deben superar los 100 caracteres'
      },
      fechaNacimiento: {
        required: 'La fecha de nacimiento es obligatoria',
        fechaNoPasada: 'La fecha de nacimiento debe ser anterior a la fecha actual'
      },
      sexo: {
        required: 'El sexo es obligatorio'
      },
      telefono: {
        pattern: 'El teléfono debe tener 9 dígitos numéricos'
      },
      email: {
        email: 'El email no tiene un formato válido',
        maxlength: 'El email no debe superar los 150 caracteres'
      },
      direccion: {
        maxlength: 'La dirección no debe superar los 250 caracteres'
      }
    };

    const primerError = Object.keys(control.errors)[0];
    return mensajes[campo]?.[primerError] || '';
  }

  construirPacienteRequest(): PacienteRequest {
    const raw = this.pacienteForm.getRawValue();

    return {
      dni: raw.dni.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      fechaNacimiento: raw.fechaNacimiento,
      sexo: raw.sexo as 'M' | 'F',
      telefono: this.campoOpcional(raw.telefono),
      email: this.campoOpcional(raw.email),
      direccion: this.campoOpcional(raw.direccion)
    };
  }

  fechaNacimientoPasada(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const fechaNacimiento = new Date(`${value}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fechaNacimiento < hoy ? null : { fechaNoPasada: true };
  }

  private campoOpcional(value: string | null | undefined): string | null {
    const limpio = value?.trim();
    return limpio ? limpio : null;
  }

  private procesarErroresPaciente(error: PacienteValidationErrors | undefined) {
    if (!error || typeof error !== 'object') {
      this.errorPaciente = 'Error al guardar el paciente.';
      return;
    }

    let tieneErroresCampo = false;
    (Object.keys(error) as Array<keyof PacienteValidationErrors>).forEach((campo) => {
      if (campo === 'error') return;

      const mensaje = error[campo];
      const control = this.pacienteForm.get(campo);
      if (control && mensaje) {
        control.setErrors({ ...control.errors, backend: mensaje });
        control.markAsTouched();
        tieneErroresCampo = true;
      }
    });

    this.errorPaciente = error.error || (tieneErroresCampo ? '' : 'Error al guardar el paciente.');
  }

  irAAgendarCita(paciente?: any) {
    this.vistaActual = 'cita';
    this.mensajeCita = '';
    this.errorCita = '';

    this.cita = {
      pacienteId: paciente?.id || null,
      especialidadId: null,
      psicologoId: null,
      fecha: '',
      hora: '',
      consultorio: '', // 🟢 Reiniciamos el consultorio
      ticketId: this.ticketActual?.id || null
    };

    this.psicologos = [];
    this.horasDisponibles = [];

    this.recepcionService.listarEspecialidades().subscribe({
      next: (esp) => {
        this.especialidades = esp;
        this.cdr.detectChanges();
      }
    });
  }

  irACalendario() {
    this.vistaActual = 'calendario';
    this.citaCalendarioSeleccionada = null;
    this.errorCalendario = '';
    this.cdr.detectChanges();
  }

  onEspecialidadChange() {
    if (!this.cita.especialidadId) return;

    this.cita.psicologoId = null;
    this.horasDisponibles = [];

    this.recepcionService.listarPsicologos(this.cita.especialidadId).subscribe({
      next: (ps) => {
        this.psicologos = ps;
        this.cdr.detectChanges();
      }
    });
  }

  onPsicologoOFechaChange() {
    if (this.cita.psicologoId && this.cita.fecha) {
      this.recepcionService.getHorarioDisponible(this.cita.psicologoId, this.cita.fecha).subscribe({
        next: (res) => {
          this.horasDisponibles = res.horasDisponibles || [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  registrarCita() {
    // validacion: exige el consultorio
    if (!this.cita.pacienteId || !this.cita.especialidadId || !this.cita.psicologoId || !this.cita.fecha || !this.cita.hora || !this.cita.consultorio) {
      this.errorCita = 'Complete todos los campos.';
      return;
    }

    // validar hora no pasada solo si la fecha es hoy
    if (this.cita.fecha === new Date().toISOString().split('T')[0]) {
      const ahora = new Date();
      const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
      if (this.cita.hora <= horaActual) {
        this.errorCita = 'No puedes agendar una cita en una hora que ya pasó.';
        return;
      }
    }

    this.agendando = true;
    this.errorCita = '';
    this.cdr.detectChanges();

    this.recepcionService.registrarCita(this.cita)
      .pipe(finalize(() => {
        this.agendando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.mensajeCita = `Cita registrada. Se generó deuda por S/ ${res.monto}.`;
          this.cita.hora = '';
          this.horasDisponibles = [];
          this.cargarTickets();
          this.cargarCitasCalendario();
        },
        error: (err) => {
          this.errorCita = err.error?.error || 'Error al registrar la cita.';
          this.cdr.detectChanges();
        }
      });
  }

  volver() {
    this.vistaActual = 'inicio';
    this.cdr.detectChanges();
  }

  private onCalendarioRango(arg: DatesSetArg) {
    const finInclusivo = new Date(arg.end);
    finInclusivo.setDate(finInclusivo.getDate() - 1);

    this.rangoCalendario = {
      inicio: this.toIsoDate(arg.start),
      fin: this.toIsoDate(finInclusivo)
    };

    this.cargarCitasCalendario();
  }

  private cargarCitasCalendario() {
    if (!this.rangoCalendario.inicio || !this.rangoCalendario.fin) return;

    this.cargandoCalendario = true;
    this.errorCalendario = '';
    this.cdr.detectChanges();

    this.recepcionService.getCitasSemana(this.rangoCalendario.inicio, this.rangoCalendario.fin)
      .pipe(finalize(() => {
        this.cargandoCalendario = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (citas) => {
          this.calendarOptions = {
            ...this.calendarOptions,
            events: citas.map(c => this.toCalendarEvent(c))
          };
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorCalendario = 'No se pudo cargar el calendario de citas.';
          this.cdr.detectChanges();
        }
      });
  }

  private toCalendarEvent(cita: any): EventInput {
    const estado = cita.estado || 'PENDIENTE_PAGO';
    return {
      id: String(cita.id),
      title: `${cita.paciente} · ${cita.psicologo}`,
      start: `${cita.fecha}T${this.normalizarHora(cita.hora)}`,
      classNames: [`fc-estado-${estado.toLowerCase()}`],
      extendedProps: cita
    };
  }

  private onCitaCalendarioClick(arg: EventClickArg) {
    this.citaCalendarioSeleccionada = arg.event.extendedProps;
    this.cdr.detectChanges();
  }

  private onHorarioCalendarioSeleccionado(arg: DateSelectArg) {
    const fecha = this.toIsoDate(arg.start);
    const hora = this.toHora(arg.start);

    this.irAAgendarCita();
    this.cita.fecha = fecha;
    this.cita.hora = hora;
    this.citaCalendarioSeleccionada = null;
    this.cdr.detectChanges();
  }

  cambiarEstadoCitaCalendario(estado: 'PENDIENTE_PAGO' | 'PAGADA' | 'CANCELADA') {
    if (!this.citaCalendarioSeleccionada?.id) return;

    this.recepcionService.cambiarEstadoCita(this.citaCalendarioSeleccionada.id, estado).subscribe({
      next: (cita) => {
        this.citaCalendarioSeleccionada = cita;
        this.cargarCitasCalendario();
      },
      error: (err) => {
        this.errorCalendario = err.error?.error || 'No se pudo actualizar la cita.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarDetalleCalendario() {
    this.citaCalendarioSeleccionada = null;
    this.cdr.detectChanges();
  }

  private normalizarHora(hora: string): string {
    return hora?.length === 5 ? `${hora}:00` : hora;
  }

  private toIsoDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toHora(fecha: Date): string {
    return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  }
}
