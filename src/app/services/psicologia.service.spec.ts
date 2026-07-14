import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PsicologiaService } from './psicologia.service';

describe('PsicologiaService - agenda autenticada', () => {
  let service: PsicologiaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PsicologiaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PsicologiaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('solicita la agenda resuelta por la identidad autenticada', () => {
    const agenda = { psicologoId: 7, nombreCompleto: 'Psicóloga responsable', citas: [] };
    let response: any;

    service.getAgenda('2099-01-10').subscribe(value => response = value);

    const request = http.expectOne(req =>
      req.url === '/api/psychology/agenda' && req.params.get('date') === '2099-01-10'
    );
    expect(request.request.method).toBe('GET');
    request.flush(agenda);
    expect(response).toEqual(agenda);
  });

  it('cambia el estado mediante el endpoint protegido de psicología', () => {
    service.cambiarEstadoCita(15, 'EN_CONSULTA').subscribe();

    const request = http.expectOne('/api/psychology/appointments/15/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'EN_CONSULTA' });
    request.flush({ id: 15, estado: 'EN_CONSULTA' });
  });
});
