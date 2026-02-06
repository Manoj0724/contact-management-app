import { Routes } from '@angular/router';
import { ContactsComponent } from './contacts/contacts.component';
import { NewContactComponent } from './contacts/new-contact/new-contact.component';
import { EditContactComponent } from './contacts/edit-contact/edit-contact.component';

export const routes: Routes = [
  { path: '', redirectTo: 'contacts', pathMatch: 'full' },
  { path: 'contacts', component: ContactsComponent },
  { path: 'contacts/new', component: NewContactComponent },
  { path: 'contacts/edit/:id', component: EditContactComponent }
];
