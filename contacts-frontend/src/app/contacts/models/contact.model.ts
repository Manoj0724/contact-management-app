export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  mobile1: string;
  address?: {
    city?: string;
  };
}
