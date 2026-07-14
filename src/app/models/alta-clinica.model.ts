export interface RegistrarAltaRequest {
  dischargeReason: string;
  treatmentSummary: string;
  achievements: string;
  recommendations: string;
  registeredBy: string;
}

export interface InformeAlta {
  id: number;
  processId: number;
  status: 'ALTA';
  patientName: string;
  patientDni: string;
  patientHistoryNumber: string;
  psychologistName: string;
  treatmentStartDate: string;
  treatmentEndDate: string;
  treatmentDays: number;
  sessionCount: number;
  dischargeReason: string;
  treatmentSummary: string;
  achievements: string;
  recommendations: string;
  registeredBy: string;
  dischargedAt: string;
}
