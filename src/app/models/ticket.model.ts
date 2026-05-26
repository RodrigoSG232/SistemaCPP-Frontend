export type EstadoTicket = 'ESPERA' | 'EN_ATENCION' | 'FINALIZADO';

export interface TicketResponse {
  id: number;
  numero: string;
  fechaEmision: string;
  estado: EstadoTicket;
}
