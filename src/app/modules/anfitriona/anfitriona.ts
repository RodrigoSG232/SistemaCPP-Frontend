import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnfitrionaService } from '../../services/anfitriona.service';
import { TicketResponse } from '../../models/ticket.model';
import { finalize } from 'rxjs/internal/operators/finalize';

@Component({
  selector: 'app-anfitriona',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anfitriona.html',
  styleUrl: './anfitriona.css'
})
export class Anfitriona implements OnInit {

  tickets: TicketResponse[] = [];
  emitiendo = false;
  ultimoTicket: TicketResponse | null = null;

  constructor(
  private anfitrionaService: AnfitrionaService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
    this.cargarTickets();
  }

  abrirPantallaSala() {
    window.open('/tickets', '_blank');
  }

  cargarTickets() {
  this.anfitrionaService.listarTicketsHoy().subscribe({
    next: (data) => {
      this.tickets = data;
      this.cdr.detectChanges();
    },
    error: () => {
      alert('No se pudieron cargar los tickets de hoy.');
    }
  });
}

  emitirTicket() {
  this.emitiendo = true;
  this.cdr.detectChanges();

  this.anfitrionaService.emitirTicket()
    .pipe(finalize(() => {
      this.emitiendo = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (ticket) => {
        this.ultimoTicket = ticket;
        this.cargarTickets();
      },
      error: () => {
        alert('No se pudo emitir el ticket. Intente nuevamente.');
      }
    });
}

  imprimirTicket(ticket: TicketResponse) {
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
