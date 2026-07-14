import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { DisponibilidadResponse, RecepcionService } from '../../services/recepcion.service';
import { Recepcion } from './recepcion';

describe('Recepcion - disponibilidad de citas', () => {
  let component: Recepcion;
  let service: RecepcionService;
  let getHorarioDisponible: ReturnType<typeof vi.fn>;
  let registrarCita: ReturnType<typeof vi.fn>;

  const disponibilidad = (
    fecha: string,
    horasDisponibles: string[],
    horasOcupadas: string[] = []
  ): DisponibilidadResponse => ({
    psicologoId: 1,
    fecha,
    horasDisponibles,
    horasOcupadas
  });

  beforeEach(() => {
    getHorarioDisponible = vi.fn();
    registrarCita = vi.fn();
    service = { getHorarioDisponible, registrarCita } as unknown as RecepcionService;
    component = new Recepcion(
      service,
      new FormBuilder(),
      { detectChanges: () => undefined } as ChangeDetectorRef
    );
  });

  it('ignora una respuesta de disponibilidad perteneciente a una fecha anterior', () => {
    const primera = new Subject<DisponibilidadResponse>();
    const segunda = new Subject<DisponibilidadResponse>();
    getHorarioDisponible.mockReturnValueOnce(primera).mockReturnValueOnce(segunda);

    component.cita.psicologoId = 1;
    component.cita.fecha = '2099-01-10';
    component.cita.hora = '10:00';
    component.horasDisponibles = ['10:00'];
    component.onPsicologoOFechaChange();

    component.cita.fecha = '2099-01-11';
    component.onPsicologoOFechaChange();

    primera.next(disponibilidad('2099-01-10', ['10:00']));
    expect(component.horasDisponibles).toEqual([]);

    segunda.next(disponibilidad('2099-01-11', ['11:00'], ['10:00']));
    expect(component.horasDisponibles).toEqual(['11:00']);
    expect(component.cita.hora).toBe('');
  });

  it('no envia una hora que ya no pertenece a la disponibilidad vigente', () => {
    getHorarioDisponible.mockReturnValue(
      of(disponibilidad('2099-01-10', ['11:00'], ['10:00']))
    );
    component.cita = {
      pacienteId: 1,
      especialidadId: 1,
      psicologoId: 1,
      fecha: '2099-01-10',
      hora: '10:00',
      consultorio: '101',
      ticketId: null
    };
    component.horasDisponibles = ['11:00'];

    component.registrarCita();

    expect(registrarCita).not.toHaveBeenCalled();
    expect(component.errorCita).toContain('ya no está disponible');
    expect(component.cita.hora).toBe('');
  });

  it('refresca las horas y limpia la seleccion cuando Scheduling responde 409', () => {
    registrarCita.mockReturnValue(throwError(() => ({
      status: 409,
      error: { error: 'Esa hora ya está reservada' }
    })));
    getHorarioDisponible.mockReturnValue(
      of(disponibilidad('2099-01-10', ['11:00'], ['10:00']))
    );
    component.cita = {
      pacienteId: 1,
      especialidadId: 1,
      psicologoId: 1,
      fecha: '2099-01-10',
      hora: '10:00',
      consultorio: '101',
      ticketId: null
    };
    component.horasDisponibles = ['10:00', '11:00'];

    component.registrarCita();

    expect(component.errorCita).toBe('Esa hora ya está reservada');
    expect(component.cita.hora).toBe('');
    expect(component.horasDisponibles).toEqual(['11:00']);
    expect(getHorarioDisponible).toHaveBeenCalledWith(1, '2099-01-10');
  });
});
