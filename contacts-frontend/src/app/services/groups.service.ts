import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private baseUrl = window.location.hostname.includes('localhost')
    ? 'http://localhost:5000'
    : 'https://contact-management-app-1-qyg8.onrender.com';

  private apiUrl = `${this.baseUrl}/api/groups`;

  constructor(private http: HttpClient) {}

  getGroups(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  createGroup(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateGroup(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteGroup(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
