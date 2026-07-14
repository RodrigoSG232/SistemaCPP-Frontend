import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class Caja implements OnInit, OnDestroy {

  filtroPaciente = '';
  filtroConcepto = 'Todos los conceptos';
  conceptos = ['Todos los conceptos', 'Gastos de cita', 'Sesión de Terapia'];

  deudas: any[] = [];
  buscando = false;
  buscado = false;
  errorCarga = '';

  deudaSeleccionada: any = null;
  medioPago = 'EFECTIVO';
  tipoComprobante = 'BOLETA';
  procesando = false;
  mostrarConfirmacionPago = false;
  comprobanteEmitido: any = null;
  errorPago = '';
  private deudasIntervalo: any;
  private actualizandoDeudas = false;

  constructor(
    private cajaService: CajaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.buscarDeudas();
    this.deudasIntervalo = setInterval(() => {
      this.buscarDeudas(true);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.deudasIntervalo) {
      clearInterval(this.deudasIntervalo);
    }
  }

  buscarDeudas(silencioso = false) {
    if (this.actualizandoDeudas) return;
    if (silencioso && (this.deudaSeleccionada || this.procesando || this.mostrarConfirmacionPago || this.comprobanteEmitido)) {
      return;
    }

    this.actualizandoDeudas = true;

    if (!silencioso) {
      this.buscando = true;
      this.buscado = false;
      this.errorCarga = '';
      this.cdr.detectChanges();
    }

    const concepto = this.filtroConcepto === 'Todos los conceptos'
      ? undefined
      : this.filtroConcepto;

    this.cajaService.buscarDeudas(this.filtroPaciente || undefined, concepto).subscribe({
      next: (res) => {
        this.deudas = res;
        this.errorCarga = '';
        this.buscando = false;
        this.buscado = true;
        this.actualizandoDeudas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deudas = [];
        this.errorCarga = err.error?.error
          || 'No se pudo consultar el microservicio de facturación.';
        this.buscando = false;
        this.buscado = true;
        this.actualizandoDeudas = false;
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
    this.mostrarConfirmacionPago = false;
    this.errorPago = '';
    this.cdr.detectChanges();
  }

  solicitarConfirmacionPago() {
    if (!this.deudaSeleccionada) return;
    this.mostrarConfirmacionPago = true;
    this.errorPago = '';
    this.cdr.detectChanges();
  }

  cerrarConfirmacionPago() {
    if (this.procesando) return;
    this.mostrarConfirmacionPago = false;
    this.cdr.detectChanges();
  }

  confirmarPago() {
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
        this.mostrarConfirmacionPago = false;
        this.comprobanteEmitido = res;
        this.deudas = this.deudas.filter(d => d.id !== this.deudaSeleccionada.id);
        this.deudaSeleccionada = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.procesando = false;
        this.mostrarConfirmacionPago = false;
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

  async descargarComprobantePdf() {
    if (!this.comprobanteEmitido?.comprobante) return;

    const { jsPDF } = await import('jspdf');
    const comprobante = this.comprobanteEmitido.comprobante || {};
    const numero = this.comprobanteEmitido.numeroComprobante || comprobante.numeroComprobante || 'SIN-NUMERO';
    const fecha = this.formatearFecha(comprobante.fechaPago || new Date().toISOString());
    const monto = Number(comprobante.montoPagado ?? 0);
    const medioPago = comprobante.medioPago || '-';
    const tipo = comprobante.tipo || '-';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Clinicas Psicologia del Peru', 16, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de pago', 16, 21);

    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(tipo, 16, 44);
    doc.setFontSize(12);
    doc.text(`Nro. ${numero}`, 150, 44);

    doc.setDrawColor(226, 232, 240);
    doc.line(16, 50, 194, 50);

    this.escribirEtiquetaValor(doc, 'Fecha de emision', fecha, 16, 62);
    this.escribirEtiquetaValor(doc, 'Paciente', comprobante.pacienteNombre || '-', 16, 74);
    this.escribirEtiquetaValor(doc, 'DNI', comprobante.pacienteDni || '-', 16, 86);
    this.escribirEtiquetaValor(doc, 'Concepto', comprobante.concepto || '-', 16, 98);
    this.escribirEtiquetaValor(doc, 'Especialidad', comprobante.especialidad || '-', 16, 110);
    this.escribirEtiquetaValor(doc, 'Medio de pago', medioPago, 16, 122);

    doc.setFillColor(240, 253, 250);
    doc.roundedRect(16, 138, 178, 28, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text('Monto pagado', 24, 149);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(6, 95, 70);
    doc.text(`S/ ${monto.toFixed(2)}`, 24, 160);

    doc.setDrawColor(226, 232, 240);
    doc.line(16, 184, 194, 184);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Documento generado por el sistema de caja.', 16, 194);
    doc.text('Entregar este comprobante al paciente luego de confirmar el pago.', 16, 201);

    doc.save(`comprobante-${numero}.pdf`);
  }

  private escribirEtiquetaValor(doc: any, etiqueta: string, valor: string, x: number, y: number) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(etiqueta, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(valor, x + 44, y);
  }

  private formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(fecha));
  }
}
