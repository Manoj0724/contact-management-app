export interface Address {
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Group {
  _id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Contact {
  _id: string;
  title: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | '';
  firstName: string;
  lastName: string;
  mobile1: string;
  mobile2?: string;
  address?: Address;
  isFavorite?: boolean;
  groups?: (Group | string)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactRow {
  title: string;
  firstName: string;
  lastName: string;
  mobile1: string;
  mobile2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  totalPages: number;
  totalContacts: number;
  page: number;
}

export interface BulkUploadResult {
  total: number;
  uploaded: number;
  failed: number;
  errorList?: { row: number; name: string; error: string }[];
}
