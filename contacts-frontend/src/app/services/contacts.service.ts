import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  private baseUrl = '/api/contacts';

  constructor(private http: HttpClient) {}

  // ========================
  // GET CONTACTS (LIST)
  // ========================
  getContacts(
    page: number,
    limit: number,
    query: string = '',
    sortBy: string = 'firstName',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Observable<any> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<any>(`${this.baseUrl}/paginate`, { params });
  }

  // ========================
  // GET SINGLE CONTACT
  // ========================
getContactById(id: string): Observable<any> {
  console.log('🌐 SERVICE: Fetching contact with ID:', id);
  return this.http.get<any>(`/api/contacts/${id}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
}

  // ========================
  // CREATE CONTACT
  // ========================
  createContact(payload: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  // ========================
  // UPDATE CONTACT
  // ========================
  updateContact(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  // ========================
  // DELETE CONTACT
  // ========================
  deleteContact(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
