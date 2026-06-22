import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EntrevistaInicialInput, ProcesoTerapeutico } from '../models/proceso-terapeutico.model';

@Injectable({ providedIn: 'root' })
export class PsicologiaService {
  private readonly base = `${environment.apiUrl}/psicologia`;

  constructor(private http: HttpClient) {}

  getAgenda(fecha?: string): Observable<any> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<any>(`${this.base}/agenda`, { params });
  }

  cambiarEstadoCita(citaId: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/citas/${citaId}/estado`, { estado });
  }

  getProceso(pacienteId: number): Observable<ProcesoTerapeutico> {
    return this.http.get<ProcesoTerapeutico>(`${this.base}/pacientes/${pacienteId}/proceso`);
  }

  iniciarProceso(pacienteId: number, citaId: number, entrevista: EntrevistaInicialInput): Observable<ProcesoTerapeutico> {
    return this.http.post<ProcesoTerapeutico>(`${this.base}/pacientes/${pacienteId}/proceso`, { citaId, entrevista });
  }

  actualizarFase(procesoId: number, faseActual: number, observaciones?: string): Observable<any> {
    return this.http.patch(`${this.base}/procesos/${procesoId}/fase`, { faseActual, observaciones });
  }

  registrarSesion(data: {
    citaId: number;
    procesoId: number;
    evolucion: string;
    indicaciones: string;
    faseSesion?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/sesiones`, data);
  }

  getSesionesPorProceso(procesoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/sesiones/proceso/${procesoId}`);
  }

  getPaciente(pacienteId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/pacientes/${pacienteId}`);
  }
}
