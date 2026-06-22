export interface EntrevistaInicialInput {
  motivoConsulta: string;
  antecedentesPersonales: string | null;
  antecedentesFamiliares: string | null;
  observacionesIniciales: string | null;
}

export interface EntrevistaInicial extends EntrevistaInicialInput {
  id: number;
  fechaRegistro: string;
}

export interface ProcesoTerapeutico {
  id: number;
  pacienteId: number;
  psicologoId: number;
  faseActual: number;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones: string | null;
  activo: boolean;
  entrevistaInicial: EntrevistaInicial | null;
}
