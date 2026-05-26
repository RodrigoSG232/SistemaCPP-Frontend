import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RecepcionService } from '../../services/recepcion.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.css']
})
export class TicketComponent implements OnInit, OnDestroy {

  ticketActual: string = '---';
  siguientes: string[] = [];

  private intervalo: any;

  constructor(
    private recepcionService: RecepcionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarVistaTickets();

    this.intervalo = setInterval(() => {
      this.cargarVistaTickets();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  cargarVistaTickets(): void {
    forkJoin({
      actual: this.recepcionService.listarTickets('EN_ATENCION'),
      espera: this.recepcionService.listarTickets('ESPERA')
    }).subscribe({
      next: ({ actual, espera }) => {
        this.ticketActual = actual.length > 0 ? actual[0].numero : '---';
        this.siguientes = espera.slice(0, 3).map(ticket => ticket.numero);
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketActual = '---';
        this.siguientes = [];
        this.cdr.detectChanges();
      }
    });
  }
}