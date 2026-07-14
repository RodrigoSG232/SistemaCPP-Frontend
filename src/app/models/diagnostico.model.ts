export interface DiagnosticoCie10 {
  code: string;
  description: string;
}

export interface ProcesoClinico {
  id: number;
  patientId: number;
  patientName?: string;
  patientDni?: string;
  patientHistoryNumber?: string;
  psychologistId?: number;
  psychologistName?: string;
  currentPhase: number;
  active: boolean;
  status: 'ACTIVO' | 'ALTA';
}

export interface CrearProcesoClinicoExternoRequest {
  appointmentId: number;
  psychologistId: number;
  psychologistName: string;
  patientName: string;
  patientDni: string;
  patientHistoryNumber: string;
  observaciones?: string | null;
  entrevista: {
    motivoConsulta: string;
    antecedentesPersonales: string | null;
    antecedentesFamiliares: string | null;
    observacionesIniciales: string | null;
  };
}

export interface HipotesisClinica {
  id: number;
  processId: number;
  sessionId: number | null;
  phase: number;
  hypothesis: string;
  therapeuticPlan: string;
  diagnoses: DiagnosticoCie10[];
  registeredBy: string;
  registeredAt: string;
}

export interface RegistrarHipotesisRequest {
  sessionId?: number;
  hypothesis: string;
  therapeuticPlan: string;
  diagnosisCodes: string[];
  registeredBy: string;
}
