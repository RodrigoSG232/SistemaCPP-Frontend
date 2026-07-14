import { ChangeDetectorRef } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { PsicologiaService } from '../../services/psicologia.service';
import { TurnoNotificacion, TurnoWebsocketService } from '../../services/turno-websocket.service';
import { Psicologia } from './psicologia';

describe('Psicologia - aislamiento de agenda y notificaciones', () => {
  let component: Psicologia;
  let getAgenda: ReturnType<typeof vi.fn>;
  let conectarPacientesListos: ReturnType<typeof vi.fn>;
  let desconectar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getAgenda = vi.fn();
    conectarPacientesListos = vi.fn();
    desconectar = vi.fn();

    const service = { getAgenda } as unknown as PsicologiaService;
    const websocket = {
      turno$: new Subject<TurnoNotificacion>().asObservable(),
      conectarPacientesListos,
      desconectar
    } as unknown as TurnoWebsocketService;

    component = new Psicologia(
      service,
      websocket,
      { detectChanges: () => undefined } as ChangeDetectorRef
    );
    component.fechaSeleccionada = '2099-01-10';
  });

  it('conserva solamente las citas del psicólogo autenticado', () => {
    getAgenda.mockReturnValue(of({
      psicologoId: 7,
      nombreCompleto: 'Psicóloga responsable',
      citas: [
        { id: 1, psicologoId: 7, estado: 'PAGADA' },
        { id: 2, psicologoId: 8, estado: 'EN_PISO' }
      ]
    }));

    component.cargarAgenda(true);

    expect(component.citas.map(cita => cita.id)).toEqual([1]);
    expect(component.alertaPacienteListo).toBeNull();
    expect(conectarPacientesListos).toHaveBeenCalledWith(7);
  });

  it('ignora un turno websocket dirigido a otro psicólogo', () => {
    component.agenda = { psicologoId: 7, nombreCompleto: 'Psicóloga responsable' };
    const turno = {
      citaId: 2,
      pacienteId: 10,
      paciente: 'Paciente ajeno',
      pacienteDni: '12345678',
      pacienteHc: 'HC-10',
      psicologoId: 8,
      psicologo: 'Otro psicólogo',
      especialidad: 'Psicología clínica',
      fecha: component.fechaSeleccionada,
      hora: '10:00',
      estado: 'EN_PISO',
      ticketNumero: null,
      mensaje: 'Paciente listo'
    } satisfies TurnoNotificacion;

    (component as any).mostrarAlertaPacienteListo(turno);

    expect(component.alertaPacienteListo).toBeNull();
    expect(getAgenda).not.toHaveBeenCalled();
  });

  it('limpia la agenda y desconecta las notificaciones cuando falla la identidad', () => {
    getAgenda.mockReturnValue(throwError(() => ({ status: 403 })));
    component.agenda = { psicologoId: 7 };
    component.citas = [{ id: 1, psicologoId: 7 }];
    component.citaActiva = { id: 1 };

    component.cargarAgenda();

    expect(component.errorAgenda).toContain('autenticado');
    expect(component.agenda).toBeNull();
    expect(component.citas).toEqual([]);
    expect(component.citaActiva).toBeNull();
    expect(desconectar).toHaveBeenCalled();
  });
});
