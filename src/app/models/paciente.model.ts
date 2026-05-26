export interface PacienteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface PacienteResponse {
  id: number;
  numeroHistoria: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  fechaApertura: string;
  activo: boolean;
}

export type PacienteValidationErrors = Partial<Record<keyof PacienteRequest, string>> & {
  error?: string;
};
