import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Group } from '../contacts/models/contact.model';

export interface GroupsResponse {
  groups: (Group & { contactCount: number })[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private apiUrl = `${environment.apiUrl}/api/groups`;

  constructor(private http: HttpClient) {}

  getGroups(): Observable<GroupsResponse> {
    return this.http.get<GroupsResponse>(this.apiUrl);
  }

  createGroup(data: Partial<Group>): Observable<{ group: Group }> {
    return this.http.post<{ group: Group }>(this.apiUrl, data);
  }

  updateGroup(id: string, data: Partial<Group>): Observable<{ group: Group }> {
    return this.http.put<{ group: Group }>(`${this.apiUrl}/${id}`, data);
  }

  deleteGroup(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
