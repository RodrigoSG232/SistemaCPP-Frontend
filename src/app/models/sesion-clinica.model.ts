export interface SesionClinica {
  id: number;
  processId: number;
  appointmentId: number;
  sessionPhase: number;
  evolution: string;
  patientIndications: string | null;
  registeredBy: string;
  registeredAt: string;
}
