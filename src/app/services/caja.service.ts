import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly base = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  buscarDeudas(paciente?: string, concepto?: string): Observable<any[]> {
    let params = new HttpParams();

    if (paciente?.trim()) {
      params = params.set('paciente', paciente.trim());
    }

    if (concepto && concepto !== 'Todos los conceptos') {
      params = params.set('concepto', concepto);
    }

    return this.http.get<any[]>(`${this.base}/deudas/buscar`, { params });
  }

  procesarPago(deudaId: number, medioPago: string, tipo = 'BOLETA'): Observable<any> {
    return this.http.post<any>(`${this.base}/pagar/${deudaId}`, { medioPago, tipo });
  }

  getComprobante(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/comprobantes/${id}`);
  }
}
