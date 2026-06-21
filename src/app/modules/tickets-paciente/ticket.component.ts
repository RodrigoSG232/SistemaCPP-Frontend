import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketPublicService } from '../../services/ticket-public.service';

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
  horaActual = new Date();
  sonidoActivado = false;

  private intervalo: any;
  private relojIntervalo: any;
  private vistaInicialCargada = false;
  private audioContext: AudioContext | null = null;

  constructor(
    private ticketPublicService: TicketPublicService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarVistaTickets();

    this.intervalo = setInterval(() => {
      this.cargarVistaTickets();
    }, 2000);

    this.relojIntervalo = setInterval(() => {
      this.horaActual = new Date();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
    if (this.relojIntervalo) {
      clearInterval(this.relojIntervalo);
    }
  }

  cargarVistaTickets(): void {
    this.ticketPublicService.getPantallaSala().subscribe({
      next: (res) => {
        const nuevoTicketActual = res.actual?.numero || '---';
        const debeAvisar = this.vistaInicialCargada
          && nuevoTicketActual !== '---'
          && nuevoTicketActual !== this.ticketActual;

        this.ticketActual = nuevoTicketActual;
        this.siguientes = (res.siguientes || []).map(ticket => ticket.numero);

        if (debeAvisar) {
          this.reproducirAviso();
        }

        this.vistaInicialCargada = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketActual = '---';
        this.siguientes = [];
        this.cdr.detectChanges();
      }
    });
  }

  async activarSonido(): Promise<void> {
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = this.audioContext || new AudioContextConstructor();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.sonidoActivado = true;
    this.reproducirAviso();
    this.cdr.detectChanges();
  }

  private reproducirAviso(): void {
    if (!this.sonidoActivado || !this.audioContext) return;

    const inicio = this.audioContext.currentTime;
    this.reproducirTono(880, inicio, 0.16);
    this.reproducirTono(1040, inicio + 0.2, 0.18);
  }

  private reproducirTono(frecuencia: number, inicio: number, duracion: number): void {
    if (!this.audioContext) return;

    const oscilador = this.audioContext.createOscillator();
    const ganancia = this.audioContext.createGain();

    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(frecuencia, inicio);
    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(0.22, inicio + 0.02);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

    oscilador.connect(ganancia);
    ganancia.connect(this.audioContext.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracion + 0.03);
  }
}
