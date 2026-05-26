import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:7171/api/audit-logs';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>                       { return this.http.get<any>(API); }
  getById(id: number): Observable<any>            { return this.http.get<any>(`${API}/${id}`); }
  getByService(name: string): Observable<any>     { return this.http.get<any>(`${API}/service/${name}`); }
  getByResource(type: string): Observable<any>    { return this.http.get<any>(`${API}/resource/${type}`); }
  getByAction(action: string): Observable<any>    { return this.http.get<any>(`${API}/action/${action}`); }
}
