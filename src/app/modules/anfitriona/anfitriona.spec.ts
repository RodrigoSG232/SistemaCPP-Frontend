import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Anfitriona } from './anfitriona';

describe('Anfitriona', () => {
  let component: Anfitriona;
  let fixture: ComponentFixture<Anfitriona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anfitriona],
    }).compileComponents();

    fixture = TestBed.createComponent(Anfitriona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
