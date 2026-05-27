import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMaintenance } from '../models/maintenance.models';

const API = 'http://localhost:7171/api/maintenance_records';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(API);
  }
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${API}/${id}`);
  }
  create(body: CreateMaintenance): Observable<any> {
    return this.http.post<any>(API, body);
  }
  update(id: number, body: Partial<CreateMaintenance>): Observable<any> {
    return this.http.patch<any>(`${API}/${id}`, body);
  }
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${API}/${id}`);
  }
}
