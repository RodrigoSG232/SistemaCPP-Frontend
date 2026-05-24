import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecepcionService } from '../../services/recepcion.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

type Vista = 'inicio' | 'historia' | 'cita';

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ticketActual: any = null;
  colaTickets: any[] = [];
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
  nuevoPaciente = {
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    sexo: '',
    direccion: ''
  };
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

  constructor(
    private recepcionService: RecepcionService,
    private cdr: ChangeDetectorRef
  ) {}


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
        this.ticketActual = tickets[0] || null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketActual = null;
        this.cdr.detectChanges();
      }
    });
  }

  emitirTicket() {
    this.recepcionService.emitirTicket().subscribe(() => {
      this.cargarTickets();
    });
  }

  llamarTicket(ticket: any) {
    if (this.ticketActual) {
      this.recepcionService.cambiarEstadoTicket(this.ticketActual.id, 'FINALIZADO').subscribe(() => {
        this.ticketActual = null;
        this.llamarTicketDirecto(ticket);
      });
    } else {
      this.llamarTicketDirecto(ticket);
    }
  }

  private llamarTicketDirecto(ticket: any) {
    this.recepcionService.cambiarEstadoTicket(ticket.id, 'EN_ATENCION').subscribe(() => {
      this.ticketActual = ticket;
      this.colaTickets = this.colaTickets.filter(t => t.id !== ticket.id);
      this.cdr.detectChanges();
    });
  }

  finalizarAtencion() {
    if (!this.ticketActual) return;

    this.recepcionService.cambiarEstadoTicket(this.ticketActual.id, 'EN_ATENCION').subscribe(() => {
      this.ticketActual = null;
      this.cargarTickets();
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
    this.nuevoPaciente = {
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '',
      telefono: '',
      email: '',
      sexo: '',
      direccion: ''
    };
    this.cdr.detectChanges();
  }

  guardarNuevoPaciente() {
    this.guardandoPaciente = true;
    this.errorPaciente = '';
    this.cdr.detectChanges();

    this.recepcionService.crearPaciente(this.nuevoPaciente)
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
          this.errorPaciente = err.error?.error || 'Error al guardar el paciente.';
          this.cdr.detectChanges();
        }
      });
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
}