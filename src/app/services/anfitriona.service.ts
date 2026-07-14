import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TicketResponse } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class AnfitrionaService {
  private readonly base = `${environment.apiUrl}/queue`;

  constructor(private http: HttpClient) {}

  emitirTicket(): Observable<TicketResponse> {
    return this.http.post<any>(`${this.base}/tickets`, {}).pipe(map(ticket => this.toTicket(ticket)));
  }

  listarTicketsHoy(): Observable<TicketResponse[]> {
    return this.http.get<any[]>(`${this.base}/tickets/today`)
      .pipe(map(tickets => tickets.map(ticket => this.toTicket(ticket))));
  }

  private toTicket(ticket: any): TicketResponse {
    return { id: Number(ticket.id), numero: ticket.number, fechaEmision: ticket.createdAt, estado: ticket.status };
  }
}
