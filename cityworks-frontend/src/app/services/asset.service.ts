import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateAsset } from '../models/asset.models';

const API = 'http://localhost:7171/api/assets';

@Injectable({ providedIn: 'root' })
export class AssetService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any>           { return this.http.get<any>(API); }
  getById(id: number): Observable<any>{ return this.http.get<any>(`${API}/${id}`); }
  create(body: CreateAsset): Observable<any>  { return this.http.post<any>(API, body); }
  update(id: number, body: Partial<CreateAsset>): Observable<any> { return this.http.patch<any>(`${API}/${id}`, body); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${API}/${id}`); }
}
