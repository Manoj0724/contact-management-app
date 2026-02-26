import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private apiUrl = '/api/contacts';

  constructor(private http: HttpClient) {}

  getContacts(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'firstName',
  sortOrder: string = 'asc',
  favoritesOnly: boolean = false,
  group: string = ''  // ← ADD THIS
): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('sortBy', sortBy)
    .set('sortOrder', sortOrder);

  if (search) {
    params = params.set('search', search);
  }

  if (favoritesOnly) {
    params = params.set('favorites', 'true');
  }

  if (group) {                           // ← ADD THIS
    params = params.set('group', group); // ← ADD THIS
  }                                      // ← ADD THIS

  return this.http.get(this.apiUrl, { params });
}
  getContactById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createContact(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateContact(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteContact(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleFavorite(id: string, isFavorite: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/favorite`, { isFavorite });
  }

  bulkDelete(ids: string[]): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bulk`, {
      body: { ids }
    });
  }

  bulkUpdateFavorite(ids: string[], isFavorite: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bulk/favorite`, {
      ids,
      isFavorite
    });
  }
}
