import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contact, ContactsResponse, BulkUploadResult } from '../contacts/models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private apiUrl = `${environment.apiUrl}/api/contacts`;

  constructor(private http: HttpClient) {}

  getContacts(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = 'firstName',
    sortOrder: string = 'asc',
    favoritesOnly: boolean = false,
    group: string = ''
  ): Observable<ContactsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (search) params = params.set('search', search);
    if (favoritesOnly) params = params.set('favorites', 'true');
    if (group) params = params.set('group', group);

    return this.http.get<ContactsResponse>(this.apiUrl, { params });
  }

  getContactById(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  createContact(data: Partial<Contact>): Observable<{ contact: Contact }> {
    return this.http.post<{ contact: Contact }>(this.apiUrl, data);
  }

  updateContact(id: string, data: Partial<Contact> | any): Observable<{ contact: Contact }> {
    return this.http.put<{ contact: Contact }>(`${this.apiUrl}/${id}`, data);
  }

  deleteContact(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleFavorite(id: string, isFavorite: boolean): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/${id}/favorite`, { isFavorite });
  }

  bulkDelete(ids: string[]): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/bulk`, {
      body: { ids }
    });
  }

  bulkUpdateFavorite(ids: string[], isFavorite: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bulk/favorite`, { ids, isFavorite });
  }

  bulkAssignGroup(ids: string[], groupId: string): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/bulk/group`, { ids, groupId });
  }
}
