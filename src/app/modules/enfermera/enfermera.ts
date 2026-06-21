import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnfermeraService, PacientePiso } from '../../services/enfermera.service';

@Component({
  selector: 'app-enfermera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enfermera.html',
  styleUrl: './enfermera.css'
})
export class Enfermera implements OnInit, OnDestroy {
  fechaSeleccionada = new Date().toISOString().split('T')[0];
  pacientes: PacientePiso[] = [];
  cargando = false;
  error = '';
  confirmandoId: number | null = null;

  private intervalo: any;

  constructor(
    private enfermeraService: EnfermeraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
    this.intervalo = setInterval(() => {
      this.cargarPacientes(true);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  get porRecibir(): PacientePiso[] {
    return this.pacientes.filter(cita => cita.estado === 'PAGADA');
  }

  get listos(): PacientePiso[] {
    return this.pacientes.filter(cita => cita.estado === 'EN_PISO');
  }

  onFechaChange(): void {
    this.cargarPacientes();
  }

  cargarPacientes(silencioso = false): void {
    if (!silencioso) {
      this.cargando = true;
      this.error = '';
      this.cdr.detectChanges();
    }

    this.enfermeraService.getPacientesPiso(this.fechaSeleccionada).subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
        this.cargando = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        if (!silencioso) {
          this.error = 'No se pudo cargar la lista de pacientes en piso.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  confirmarEnPiso(cita: PacientePiso): void {
    this.confirmandoId = cita.id;
    this.error = '';
    this.cdr.detectChanges();

    this.enfermeraService.confirmarEnPiso(cita.id).subscribe({
      next: (actualizada) => {
        this.pacientes = this.pacientes.map(item => item.id === actualizada.id ? actualizada : item);
        this.confirmandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.confirmandoId = null;
        this.error = err.error?.error || 'No se pudo confirmar al paciente en piso.';
        this.cdr.detectChanges();
      }
    });
  }
}
