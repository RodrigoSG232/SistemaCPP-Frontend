import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../services/caja.service';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class Caja implements OnInit {

  filtroPaciente = '';
  filtroConcepto = 'Todos los conceptos';
  conceptos = ['Todos los conceptos', 'Gastos de cita', 'Sesión de Terapia'];

  deudas: any[] = [];
  buscando = false;
  buscado = false;

  deudaSeleccionada: any = null;
  medioPago = 'EFECTIVO';
  tipoComprobante = 'BOLETA';
  procesando = false;
  comprobanteEmitido: any = null;
  errorPago = '';

  constructor(
    private cajaService: CajaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.buscarDeudas();
  }

  buscarDeudas() {
    this.buscando = true;
    this.buscado = false;
    this.cdr.detectChanges();

    const concepto = this.filtroConcepto === 'Todos los conceptos'
      ? undefined
      : this.filtroConcepto;

    this.cajaService.buscarDeudas(this.filtroPaciente || undefined, concepto).subscribe({
      next: (res) => {
        this.deudas = res;
        this.buscando = false;
        this.buscado = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscando = false;
        this.buscado = true;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarDeuda(deuda: any) {
    this.deudaSeleccionada = deuda;
    this.medioPago = 'EFECTIVO';
    this.tipoComprobante = 'BOLETA';
    this.comprobanteEmitido = null;
    this.errorPago = '';
    this.cdr.detectChanges();
  }

  cancelarPago() {
    this.deudaSeleccionada = null;
    this.comprobanteEmitido = null;
    this.errorPago = '';
    this.cdr.detectChanges();
  }

  procesarPago() {
    if (!this.deudaSeleccionada) return;

    this.procesando = true;
    this.errorPago = '';
    this.cdr.detectChanges();

    this.cajaService.procesarPago(
      this.deudaSeleccionada.id,
      this.medioPago,
      this.tipoComprobante
    ).subscribe({
      next: (res) => {
        this.procesando = false;
        this.comprobanteEmitido = res;
        this.deudas = this.deudas.filter(d => d.id !== this.deudaSeleccionada.id);
        this.deudaSeleccionada = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.procesando = false;
        this.errorPago = err.error?.error || 'Error al procesar el pago.';
        this.cdr.detectChanges();
      }
    });
  }

  nuevaBusqueda() {
    this.comprobanteEmitido = null;
    this.buscarDeudas();
    this.cdr.detectChanges();
  }
}