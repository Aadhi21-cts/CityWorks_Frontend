import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../models/service-request.models';

const API = 'http://localhost:7171/api/requests';

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>           { return this.http.get<any>(API); }
  getById(id: number): Observable<any>{ return this.http.get<any>(`${API}/${id}`); }
  getByCitizen(citizenId: number): Observable<any> { return this.http.get<any>(`${API}/citizen/${citizenId}`); }
  create(body: ServiceRequest): Observable<any> { return this.http.post<any>(API, body); }
  approve(id: number): Observable<any>{ return this.http.put<any>(`${API}/${id}/approve`, {}); }
  reject(id: number): Observable<any> { return this.http.put<any>(`${API}/${id}/reject`, {}); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${API}/${id}`); }
}
