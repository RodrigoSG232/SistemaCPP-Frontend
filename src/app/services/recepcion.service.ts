import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PacienteRequest, PacienteResponse } from '../models/paciente.model';
import { EstadoTicket, TicketResponse } from '../models/ticket.model';

export interface DisponibilidadResponse {
  psicologoId: number;
  fecha: string;
  horasDisponibles: string[];
  horasOcupadas: string[];
}

@Injectable({ providedIn: 'root' })
export class RecepcionService {
  private readonly patientBase = `${environment.apiUrl}/patients`;
  private readonly schedulingBase = `${environment.apiUrl}/scheduling`;
  private readonly billingBase = `${environment.apiUrl}/billing`;
  private readonly queueBase = `${environment.apiUrl}/queue`;

  constructor(private http: HttpClient) {}

  // ── Tickets ──────────────────────────────────────────────
  listarTickets(estado: EstadoTicket = 'ESPERA'): Observable<TicketResponse[]> {
    return this.http.get<any[]>(`${this.queueBase}/tickets`, { params: { status: estado } })
      .pipe(map(tickets => tickets.map(ticket => this.toTicket(ticket))));
  }

  cambiarEstadoTicket(id: number, estado: EstadoTicket): Observable<TicketResponse> {
    const action = estado === 'EN_ATENCION' ? 'call' : 'finish';
    return this.http.patch<any>(`${this.queueBase}/tickets/${id}/${action}`, {})
      .pipe(map(ticket => this.toTicket(ticket)));
  }

  // ── Pacientes ─────────────────────────────────────────────
  buscarPacientes(q: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.patientBase}/search`, { params: { q } });
  }
  getPacientePorDni(dni: string): Observable<any> {
    return this.http.get<any>(`${this.patientBase}/dni/${dni}`);
  }
  crearPaciente(paciente: PacienteRequest): Observable<PacienteResponse> {
    return this.http.post<PacienteResponse>(this.patientBase, paciente);
  }

  // ── Especialidades y psicólogos ──────────────────────────
  listarEspecialidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.schedulingBase}/specialties`);
  }
  listarPsicologos(especialidadId?: number): Observable<any[]> {
    // Usamos HttpParams para evitar el error de tipado con undefined
    let params = new HttpParams();
    if (especialidadId != null) params = params.set('specialtyId', especialidadId.toString());
    return this.http.get<any[]>(`${this.schedulingBase}/psychologists`, { params });
  }
  getHorarioDisponible(psicologoId: number, fecha: string): Observable<DisponibilidadResponse> {
    return this.http.get<DisponibilidadResponse>(
      `${this.schedulingBase}/psychologists/${psicologoId}/availability`,
      { params: { date: fecha } }
    );
  }

  // ── Citas ─────────────────────────────────────────────────
  registrarCita(data: any): Observable<any> {
    const request = {
      pacienteId: data.pacienteId,
      psicologoId: data.psicologoId,
      especialidadId: data.especialidadId,
      fecha: data.fecha,
      hora: data.hora
    };
    return this.http.post<any>(`${this.schedulingBase}/appointments`, request).pipe(
      switchMap(cita => this.http.post<any>(`${this.billingBase}/debts/from-appointment/${cita.id}`, {}).pipe(
        map(() => cita),
        catchError(error => this.http.patch(
          `${this.schedulingBase}/appointments/${cita.id}/status`, { estado: 'CANCELADA' }
        ).pipe(switchMap(() => throwError(() => error))))
      ))
    );
  }
  vincularTicketProductividad(citaId: number, pacienteId: number, ticketId?: number | null): Observable<any> {
    if (ticketId) {
      return this.http.patch(`${this.queueBase}/tickets/${ticketId}/appointment`, {
        appointmentId: citaId,
        patientId: pacienteId
      });
    }
    const params = new HttpParams().set('patientId', pacienteId);
    return this.http.post(`${environment.apiUrl}/queue/tickets/appointments/${citaId}`, null, { params });
  }
  getCitasSemana(inicio: string, fin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.schedulingBase}/appointments/week`, { params: { start: inicio, end: fin } });
  }
  cambiarEstadoCita(citaId: number, estado: string): Observable<any> {
    return this.http.patch<any>(`${this.schedulingBase}/appointments/${citaId}/status`, { estado });
  }
  getCitasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.schedulingBase}/appointments/patient/${pacienteId}`);
  }

  private toTicket(ticket: any): TicketResponse {
    return {
      id: Number(ticket.id),
      numero: ticket.number,
      fechaEmision: ticket.createdAt,
      estado: ticket.status
    };
  }
}
