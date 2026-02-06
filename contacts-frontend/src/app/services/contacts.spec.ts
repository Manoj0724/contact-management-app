import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContactsService,
        provideHttpClient()
      ]
    });

    service = TestBed.inject(ContactsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
