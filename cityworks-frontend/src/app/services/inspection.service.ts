import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateInspection } from '../models/inspection.models';

const API = 'http://localhost:7171/api/inspection_record';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>           { return this.http.get<any>(API); }
  getById(id: number): Observable<any>{ return this.http.get<any>(`${API}/${id}`); }
  create(body: CreateInspection): Observable<any>  { return this.http.post<any>(API, body); }
  update(id: number, body: Partial<CreateInspection>): Observable<any> { return this.http.patch<any>(`${API}/${id}`, body); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${API}/${id}`); }
}
