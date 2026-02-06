# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-07

### Added
- Contact list view with pagination (3, 5, 10, 20 items per page)
- Search functionality (basic text search)
- Advanced search with filters (First Name, Last Name, Mobile, City)
- Add new contact form with full validation
- Edit contact form with pre-filled data
- Delete contact with confirmation dialog
- CSV export functionality
- Form validation with visual feedback (red borders)
- Responsive UI design
- Toast notifications for success/error messages

### Validation Rules
- Title: Required dropdown selection
- First Name: Required, letters only
- Last Name: Required, letters only
- Mobile 1: Required, exactly 10 digits
- Mobile 2: Optional, if provided must be 10 digits
- City: Required, letters only
- State: Required, letters only
- Pincode: Required, exactly 6 digits

### Technical Details
- Angular 17 with standalone components
- TypeScript for type safety
- Bootstrap 5 for styling
- Angular Material for snackbar notifications
- MongoDB for data persistence
- RESTful API architecture
