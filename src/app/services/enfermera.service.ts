import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly base = `${environment.apiUrl}/enfermera`;

  constructor(private http: HttpClient) {}

  getPacientesPiso(fecha?: string): Observable<PacientePiso[]> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<PacientePiso[]>(`${this.base}/pacientes-piso`, { params });
  }

  confirmarEnPiso(citaId: number): Observable<PacientePiso> {
    return this.http.patch<PacientePiso>(`${this.base}/citas/${citaId}/en-piso`, {});
  }
}
