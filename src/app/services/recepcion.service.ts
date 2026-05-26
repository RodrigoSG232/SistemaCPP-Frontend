import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PacienteRequest, PacienteResponse } from '../models/paciente.model';

@Injectable({ providedIn: 'root' })
export class RecepcionService {
  private readonly base = `${environment.apiUrl}/recepcion`;

  constructor(private http: HttpClient) {}

  // ── Tickets ──────────────────────────────────────────────
  listarTickets(estado = 'ESPERA'): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/tickets`, { params: { estado } });
}
  emitirTicket(): Observable<any> {
    return this.http.post<any>(`${this.base}/tickets/emitir`, {});
  }
  cambiarEstadoTicket(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/tickets/${id}/estado`, { estado });
  }

  // ── Pacientes ─────────────────────────────────────────────
  buscarPacientes(q: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/pacientes/buscar`, { params: { q } });
  }
  getPacientePorDni(dni: string): Observable<any> {
    return this.http.get<any>(`${this.base}/pacientes/dni/${dni}`);
  }
  crearPaciente(paciente: PacienteRequest): Observable<PacienteResponse> {
    return this.http.post<PacienteResponse>(`${this.base}/pacientes`, paciente);
  }

  // ── Especialidades y psicólogos ──────────────────────────
  listarEspecialidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/especialidades`);
  }
  listarPsicologos(especialidadId?: number): Observable<any[]> {
    // Usamos HttpParams para evitar el error de tipado con undefined
    let params = new HttpParams();
    if (especialidadId != null) {
      params = params.set('especialidadId', especialidadId.toString());
    }
    return this.http.get<any[]>(`${this.base}/psicologos`, { params });
  }
  getHorarioDisponible(psicologoId: number, fecha: string): Observable<any> {
    return this.http.get<any>(`${this.base}/psicologos/${psicologoId}/horario-disponible`, { params: { fecha } });
  }

  // ── Citas ─────────────────────────────────────────────────
  registrarCita(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/citas`, data);
  }
  getCitasPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/citas/paciente/${pacienteId}`);
  }
}
