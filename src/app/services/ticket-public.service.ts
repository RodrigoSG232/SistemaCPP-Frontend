import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TicketResponse } from '../models/ticket.model';

export interface PantallaSalaResponse {
  actual: TicketResponse | null;
  siguientes: TicketResponse[];
}

@Injectable({ providedIn: 'root' })
export class TicketPublicService {
  private readonly base = `${environment.apiUrl}/queue`;

  constructor(private http: HttpClient) {}

  getPantallaSala(): Observable<PantallaSalaResponse> {
    return this.http.get<any>(`${this.base}/public/display`).pipe(map(display => ({
      actual: display.current ? this.toTicket(display.current) : null,
      siguientes: (display.next || []).map((ticket: any) => this.toTicket(ticket))
    })));
  }

  private toTicket(ticket: any): TicketResponse {
    return { id: Number(ticket.id), numero: ticket.number, fechaEmision: ticket.createdAt, estado: ticket.status };
  }
}
