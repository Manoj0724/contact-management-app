import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContact } from './edit-contact.component';

describe('EditContact', () => {
  let component: EditContact;
  let fixture: ComponentFixture<EditContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditContact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
