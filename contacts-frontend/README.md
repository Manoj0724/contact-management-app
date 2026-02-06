# Contact Management Application

A full-stack contact management system built with Angular and Node.js.

## Version 1.0.0 (February 2026)

### Features
- ✅ View contacts list with pagination
- ✅ Search contacts (basic and advanced)
- ✅ Add new contacts with validation
- ✅ Edit existing contacts
- ✅ Delete contacts with confirmation
- ✅ Export contacts to CSV
- ✅ Form validation with red border indicators
- ✅ Responsive UI design

### Tech Stack

**Frontend:**
- Angular 17+
- TypeScript
- Bootstrap 5
- Angular Material

**Backend:**
- Node.js
- Express.js
- MongoDB

### Mandatory Fields Validation
- Title (required)
- First Name (letters only, required)
- Last Name (letters only, required)
- Mobile 1 (exactly 10 digits, required)
- Mobile 2 (exactly 10 digits, optional)
- City (letters only, required)
- State (letters only, required)
- Pincode (exactly 6 digits, required)

## Installation

### Frontend Setup
```bash
cd contacts-frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

## Usage
1. Backend runs on `http://localhost:5000`
2. Frontend runs on `http://localhost:4200`
3. Navigate to `http://localhost:4200/contacts`

## Project Structure
```
contact_js/
├── backend/              # Express.js API
├── contacts-frontend/    # Angular application
├── legacy/              # Archived legacy code
├── contacts.json        # Sample data
└── README.md           # This file
```

## Author
Your Name

## License
MIT
