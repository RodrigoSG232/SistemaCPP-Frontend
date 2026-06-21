import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nombreCompleto: string;
  rol: string;
  ruta: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, req);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuarioActual');
    sessionStorage.removeItem('rol');
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('rol');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRol(): string | null {
    return sessionStorage.getItem('rol');
  }

  getPerfil(): Observable<any> {
  return this.http.get(`/api/auth/me`);
}

  updatePerfil(data: any): Observable<any> {
    return this.http.put(`/api/auth/me`, data);
  }
}
