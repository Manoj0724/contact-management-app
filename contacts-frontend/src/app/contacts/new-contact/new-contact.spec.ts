import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewContact } from './new-contact.component';

describe('NewContact', () => {
  let component: NewContact;
  let fixture: ComponentFixture<NewContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
