import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

interface Specialty {
  title: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, Header, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  currentIndex = 0;

  specialties: Specialty[] = [
    {
      title: 'Psicología Clínica',
      description:
        'Atención psicológica profesional para ansiedad, depresión, estrés y bienestar emocional.',
      image: '/assets/landing/psicologia_clinica.jpg',
    },
    {
      title: 'Terapia Familiar',
      description:
        'Acompañamiento para mejorar la comunicación, convivencia y vínculos dentro de la familia.',
      image: '/assets/landing/terapia_familiar.jpg',
    },
    {
      title: 'Psicología Infantil',
      description:
        'Evaluación y orientación psicológica para niños, niñas y adolescentes.',
      image: '/assets/landing/psicologia_infantil.jpg',
    },
    {
      title: 'Terapia de Pareja',
      description:
        'Espacio terapéutico para fortalecer la relación, resolver conflictos y mejorar la comunicación.',
      image: '/assets/landing/terapia_pareja.jpg',
    },
    {
      title: 'Evaluación Psicológica',
      description:
        'Aplicación de pruebas psicológicas para diagnóstico, orientación y seguimiento profesional.',
      image: '/assets/landing/evaluacion_psicologica.jpg',
    },
  ];

  get visibleSpecialties(): Specialty[] {
    const visibleCount = 3;
    const result: Specialty[] = [];

    for (let i = 0; i < visibleCount; i++) {
      const index = (this.currentIndex + i) % this.specialties.length;
      result.push(this.specialties[index]);
    }

    return result;
  }

  nextSpecialty(): void {
    this.currentIndex = (this.currentIndex + 1) % this.specialties.length;
  }

  previousSpecialty(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.specialties.length) %
      this.specialties.length;
  }
}