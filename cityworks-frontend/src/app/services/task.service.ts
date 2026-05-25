import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTask, UpdateTask } from '../models/task.models';

const API = 'http://localhost:7171/api/tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>           { return this.http.get<any>(API); }
  getById(id: number): Observable<any>{ return this.http.get<any>(`${API}/${id}`); }
  create(body: CreateTask): Observable<any>  { return this.http.post<any>(API, body); }
  update(id: number, body: UpdateTask): Observable<any> { return this.http.patch<any>(`${API}/${id}`, body); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${API}/${id}`); }
}
