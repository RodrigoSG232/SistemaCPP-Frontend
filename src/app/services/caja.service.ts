import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly base = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  buscarDeudas(paciente?: string, concepto?: string): Observable<any[]> {
    let params = new HttpParams();

    if (paciente?.trim()) params = params.set('patient', paciente.trim());
    if (concepto && concepto !== 'Todos los conceptos') params = params.set('concept', concepto);
    return this.http.get<any[]>(`${this.base}/debts`, { params });
  }

  procesarPago(deudaId: number, medioPago: string, tipo = 'BOLETA'): Observable<any> {
    const cajero = sessionStorage.getItem('usuarioActual') || 'Caja';
    return this.http.post<any>(`${this.base}/payments/${deudaId}`, { medioPago, tipo, cajero });
  }

  getComprobante(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/receipts/${id}`);
  }
}
