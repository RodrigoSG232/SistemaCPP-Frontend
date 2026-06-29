import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminResumen {
  usuarios: number;
  activos: number;
  inactivos: number;
  roles: number;
}

export interface AdminRol {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface AdminUsuario {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  rolId: number;
  rol: string;
  activo: boolean;
  creadoEn: string | null;
}

export interface AdminUsuarioPayload {
  username: string;
  nombreCompleto: string;
  email: string;
  rolId: number | null;
  activo: boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getResumen(): Observable<AdminResumen> {
    return this.http.get<AdminResumen>(`${this.base}/resumen`);
  }

  listarRoles(): Observable<AdminRol[]> {
    return this.http.get<AdminRol[]>(`${this.base}/roles`);
  }

  listarUsuarios(q?: string): Observable<AdminUsuario[]> {
    let params = new HttpParams();
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<AdminUsuario[]>(`${this.base}/usuarios`, { params });
  }

  crearUsuario(payload: AdminUsuarioPayload): Observable<AdminUsuario> {
    return this.http.post<AdminUsuario>(`${this.base}/usuarios`, payload);
  }

  actualizarUsuario(id: number, payload: AdminUsuarioPayload): Observable<AdminUsuario> {
    return this.http.put<AdminUsuario>(`${this.base}/usuarios/${id}`, payload);
  }

  cambiarEstado(id: number, activo: boolean): Observable<AdminUsuario> {
    return this.http.patch<AdminUsuario>(`${this.base}/usuarios/${id}/estado`, { activo });
  }
}
