import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TurnoNotificacion {
  citaId: number;
  pacienteId: number;
  paciente: string;
  pacienteDni: string;
  pacienteHc: string;
  psicologoId: number;
  psicologo: string;
  especialidad: string;
  fecha: string;
  hora: string;
  estado: string;
  ticketNumero: string | null;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class TurnoWebsocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private conectado = false;
  private reconnectTimeout: any;
  private subscriptionId = 'pacientes-listos';
  private destination = '';

  private turnoSubject = new Subject<TurnoNotificacion>();
  turno$ = this.turnoSubject.asObservable();

  conectarPacientesListos(psicologoId: number): void {
    const destination = `/topic/psicologos/${psicologoId}/pacientes-listos`;

    if (this.destination === destination && this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.destination = destination;
    this.desconectar(false);
    this.conectar();
  }

  private conectar(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.getWsUrl();
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.enviarFrame(`CONNECT\naccept-version:1.2\nheart-beat:0,0\nhost:${this.getWsHost(wsUrl)}\n\n`);
    };

    this.socket.onmessage = (event) => this.procesarFrame(event.data);

    this.socket.onclose = () => {
      this.conectado = false;
      if (this.destination) {
        this.reconnectTimeout = setTimeout(() => this.conectar(), 5000);
      }
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  desconectar(limpiarDestino = true): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.enviarFrame('DISCONNECT\n\n');
    }

    this.socket?.close();
    this.socket = null;
    this.conectado = false;

    if (limpiarDestino) {
      this.destination = '';
    }
  }

  ngOnDestroy(): void {
    this.desconectar();
  }

  private getWsUrl(): string {
    const configuredUrl = environment.wsUrl;
    if (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://')) {
      return configuredUrl;
    }

    if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
      return configuredUrl.replace(/^http/, 'ws');
    }

    const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = configuredUrl.startsWith('/') ? configuredUrl : `/${configuredUrl}`;
    return `${protocolo}//${window.location.host}${path}`;
  }

  private getWsHost(wsUrl: string): string {
    try {
      return new URL(wsUrl).host;
    } catch {
      return window.location.host;
    }
  }

  private procesarFrame(data: string): void {
    const frames = data.split('\0').filter(frame => frame.trim());

    frames.forEach(frame => {
      if (frame.startsWith('CONNECTED')) {
        this.conectado = true;
        this.enviarFrame(`SUBSCRIBE\nid:${this.subscriptionId}\ndestination:${this.destination}\n\n`);
        return;
      }

      if (frame.startsWith('MESSAGE')) {
        const bodyIndex = frame.indexOf('\n\n');
        if (bodyIndex === -1) return;

        const body = frame.slice(bodyIndex + 2).trim();
        if (!body) return;

        try {
          this.turnoSubject.next(JSON.parse(body) as TurnoNotificacion);
        } catch {
          // Ignorar frames no JSON para mantener viva la conexión.
        }
      }
    });
  }

  private enviarFrame(frame: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(`${frame}\0`);
  }
}
