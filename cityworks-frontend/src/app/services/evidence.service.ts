import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:7171/api/completion_evidence';

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(API);
  }
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${API}/${id}`);
  }
  getByTaskId(taskId: number): Observable<any> {
    return this.http.get<any>(`${API}/tasks?taskId=${taskId}`);
  }

  getByWorkOrderId(orderId: number): Observable<any> {
    return this.http.get<any>(`${API}/workorder?workOrderId=${orderId}`);
  }
  create(body: any): Observable<any> {
    return this.http.post<any>(API, body);
  }
  update(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/status?status=${status}`, status);
  }
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${API}/${id}`);
  }
}
