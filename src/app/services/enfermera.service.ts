import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PacientePiso {
  id: number;
  fecha: string;
  hora: string;
  estado: 'PAGADA' | 'EN_PISO' | 'EN_CONSULTA' | 'ATENDIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';
  psicologo: string;
  especialidad: string;
  paciente: string;
  pacienteId: number;
  pacienteDni: string;
  pacienteHc: string;
}

@Injectable({ providedIn: 'root' })
export class EnfermeraService {
  private readonly base = `${environment.apiUrl}/scheduling`;

  constructor(private http: HttpClient) {}

  getPacientesPiso(fecha?: string): Observable<PacientePiso[]> {
    const selectedDate = fecha || new Date().toISOString().slice(0, 10);
    const params = new HttpParams().set('start', selectedDate).set('end', selectedDate);
    return this.http.get<PacientePiso[]>(`${this.base}/appointments/week`, { params }).pipe(
      map(citas => citas.filter(cita => cita.estado === 'PAGADA' || cita.estado === 'EN_PISO'))
    );
  }

  confirmarEnPiso(citaId: number): Observable<PacientePiso> {
    return this.http.patch<PacientePiso>(`${this.base}/appointments/${citaId}/status`, { estado: 'EN_PISO' });
  }
}
