import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateWorkOrderRequest, AssignWorkerRequest } from '../models/work-order.models';

const API = 'http://localhost:7171/api/workorders';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>                     { return this.http.get<any>(`${API}/all`); }
  getById(id: number): Observable<any>          { return this.http.get<any>(`${API}/${id}`); }
  getByWorker(workerId: number): Observable<any>{ return this.http.get<any>(`${API}?workerId=${workerId}`); }
  create(body: CreateWorkOrderRequest): Observable<any> { return this.http.post<any>(API, body); }
  assignWorker(body: AssignWorkerRequest): Observable<any> { return this.http.put<any>(`${API}/assign`, body); }
  updateStatus(orderId: number, status: string): Observable<any> {
    return this.http.put<any>(`${API}/${orderId}/status?status=${status}`, {});
  }
  getByRequestId(requestId:number): Observable<any>{
    return this.http.get<any>(`${API}/requestId?requestId=${requestId}`);
  }
}
