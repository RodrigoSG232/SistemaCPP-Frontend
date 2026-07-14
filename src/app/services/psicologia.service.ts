import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearProcesoClinicoExternoRequest, DiagnosticoCie10, HipotesisClinica, ProcesoClinico, RegistrarHipotesisRequest } from '../models/diagnostico.model';
import { SesionClinica } from '../models/sesion-clinica.model';
import { InformeAlta, RegistrarAltaRequest } from '../models/alta-clinica.model';

@Injectable({ providedIn: 'root' })
export class PsicologiaService {
  private readonly clinicalBase = `${environment.apiUrl}/clinical`;
  private readonly psychologyBase = `${environment.apiUrl}/psychology`;
  private readonly patientBase = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  getAgenda(fecha?: string): Observable<any> {
    const selectedDate = fecha || new Date().toISOString().slice(0, 10);
    const params = new HttpParams().set('date', selectedDate);
    return this.http.get<any>(`${this.psychologyBase}/agenda`, { params });
  }

  cambiarEstadoCita(citaId: number, estado: string): Observable<any> {
    return this.http.patch(`${this.psychologyBase}/appointments/${citaId}/status`, { estado });
  }

  getPaciente(pacienteId: number): Observable<any> {
    return this.http.get<any>(`${this.patientBase}/${pacienteId}`);
  }

  buscarDiagnosticosCie10(query: string): Observable<DiagnosticoCie10[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<DiagnosticoCie10[]>(`${this.clinicalBase}/diagnoses/cie10`, { params });
  }

  getProcesoClinicoActivo(pacienteId: number): Observable<ProcesoClinico> {
    return this.http.get<ProcesoClinico>(`${this.clinicalBase}/patients/${pacienteId}/processes/active`);
  }

  iniciarProcesoClinicoExterno(pacienteId: number, request: CrearProcesoClinicoExternoRequest): Observable<ProcesoClinico> {
    return this.http.post<ProcesoClinico>(`${this.clinicalBase}/external/patients/${pacienteId}/processes`, request);
  }

  asegurarTicketVinculado(citaId: number, pacienteId: number): Observable<any> {
    const params = new HttpParams().set('patientId', pacienteId);
    return this.http.post(`${environment.apiUrl}/queue/tickets/appointments/${citaId}`, null, { params });
  }

  actualizarFaseClinica(procesoId: number, faseActual: number): Observable<ProcesoClinico> {
    return this.http.patch<ProcesoClinico>(`${this.clinicalBase}/processes/${procesoId}/phase`, { faseActual });
  }

  getSesionesClinicas(procesoId: number): Observable<SesionClinica[]> {
    return this.http.get<SesionClinica[]>(`${this.clinicalBase}/processes/${procesoId}/sessions`);
  }

  registrarSesionClinicaExterna(data: {
    processId: number;
    appointmentId: number;
    sessionPhase: number;
    evolution: string;
    patientIndications: string;
    registeredBy: string;
  }): Observable<SesionClinica> {
    return this.http.post<SesionClinica>(`${this.clinicalBase}/external/sessions`, data);
  }

  registrarAlta(procesoId: number, request: RegistrarAltaRequest): Observable<InformeAlta> {
    return this.http.post<InformeAlta>(`${this.clinicalBase}/processes/${procesoId}/discharge`, request);
  }

  getUltimoInformeAlta(pacienteId: number): Observable<InformeAlta> {
    return this.http.get<InformeAlta>(`${this.clinicalBase}/patients/${pacienteId}/discharge-report/latest`);
  }

  registrarHipotesis(procesoId: number, request: RegistrarHipotesisRequest): Observable<HipotesisClinica> {
    return this.http.post<HipotesisClinica>(`${this.clinicalBase}/processes/${procesoId}/hypotheses`, request);
  }

  getHipotesis(procesoId: number): Observable<HipotesisClinica[]> {
    return this.http.get<HipotesisClinica[]>(`${this.clinicalBase}/processes/${procesoId}/hypotheses`);
  }
}
