import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TicketResponse } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class AnfitrionaService {
  private readonly base = `${environment.apiUrl}/anfitriona`;

  constructor(private http: HttpClient) {}

  emitirTicket(): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.base}/tickets/emitir`, {});
  }

  listarTicketsHoy(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${this.base}/tickets/hoy`);
  }
}
