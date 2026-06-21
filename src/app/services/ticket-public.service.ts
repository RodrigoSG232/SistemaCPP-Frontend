import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TicketResponse } from '../models/ticket.model';

export interface PantallaSalaResponse {
  actual: TicketResponse | null;
  siguientes: TicketResponse[];
}

@Injectable({ providedIn: 'root' })
export class TicketPublicService {
  private readonly base = `${environment.apiUrl}/public/tickets`;

  constructor(private http: HttpClient) {}

  getPantallaSala(): Observable<PantallaSalaResponse> {
    return this.http.get<PantallaSalaResponse>(`${this.base}/sala`);
  }
}
