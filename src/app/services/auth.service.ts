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
  refreshToken: string;
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

  refresh(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/refresh`, { refreshToken });
  }

  guardarSesion(res: LoginResponse): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('rol');

    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('refreshToken', res.refreshToken);
    sessionStorage.setItem('usuarioActual', res.nombreCompleto || res.username);
    sessionStorage.setItem('rol', res.rol);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('usuarioActual');
    sessionStorage.removeItem('rol');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  getPerfil(): Observable<any> {
    return this.http.get(`${this.base}/me`);
  }

  updatePerfil(data: any): Observable<any> {
    return this.http.put(`${this.base}/me`, data);
  }
}
