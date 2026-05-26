import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-anfitriona',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anfitriona.html',
  styleUrl: './anfitriona.css'
})
export class Anfitriona implements OnInit {

  tickets: any[] = [];
  emitiendo = false;
  ultimoTicket: any = null;

  private base = `${environment.apiUrl}/recepcion`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarTickets();
  }

  private headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  cargarTickets() {
    this.http.get<any[]>(`${this.base}/tickets?estado=ESPERA`, this.headers()).subscribe({
      next: (data) => this.tickets = data,
      error: () => {}
    });
  }

  emitirTicket() {
    this.emitiendo = true;
    this.http.post<any>(`${this.base}/tickets/emitir`, {}, this.headers()).subscribe({
      next: (ticket) => {
        this.ultimoTicket = ticket;
        this.emitiendo = false;
        this.cargarTickets();
      },
      error: () => { this.emitiendo = false; }
    });
  }

  imprimirTicket(ticket: any) {
    const ventana = window.open('', '_blank', 'width=300,height=400');
    if (!ventana) return;
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${ticket.numero}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 20px; }
            h1 { font-size: 48px; margin: 20px 0; }
            p { font-size: 14px; margin: 4px 0; }
            hr { margin: 10px 0; }
          </style>
        </head>
        <body>
          <p><strong>Clinicas Psicologia del Peru</strong></p>
          <hr/>
          <p>Turno de atencion</p>
          <h1>${ticket.numero}</h1>
          <hr/>
          <p>Fecha: ${new Date().toLocaleDateString('es-PE')}</p>
          <p>Hora: ${new Date().toLocaleTimeString('es-PE')}</p>
          <p>Acerquese a recepcion cuando sea llamado</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    ventana.document.close();
  }
}