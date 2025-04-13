# Document Management API

A NestJS-based API for managing documents with role-based access control.

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v12 or later)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gateway
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=appDB
JWT_SECRET=your-secret-key
UPLOAD_PATH=uploads
UPLOAD_MAX_FILE_SIZE=1048576
```

4. Create the uploads directory:
```bash
mkdir uploads
```

## Database Setup

1. Create a PostgreSQL database:
```bash
createdb appDB
```

2. Run database migrations:
```bash
npm run migration:run
```

3. Seed the database with initial data:
```bash
npm run seed:run
```

This will create:
- Admin user (email: admin@example.com, password: admin123)
- Roles (admin, editor, viewer)
- Permissions for document management
- Role-permission mappings

## Running the Application

1. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Access the Swagger API documentation at:
```
http://localhost:3000/api
```

The Swagger UI provides:
- Interactive API documentation
- Request/response examples
- Authentication details
- Endpoint testing capabilities

## Testing

### Unit Tests

Run unit tests:
```bash
npm run test
```

Run unit tests with coverage:
```bash
npm run test:cov
```

### E2E Tests

Run end-to-end tests:
```bash
npm run test:e2e
```

Run end-to-end tests with coverage:
```bash
npm run test:e2e:cov
```

### Test Database Setup

The test suite uses a separate test database. Make sure to:

1. Create a test database:
```bash
createdb appDB_test
```

2. The test suite will automatically:
   - Set up the test database schema
   - Run migrations
   - Seed test data
   - Clean up after tests

## Project Structure

```
src/
├── document/           # Document management module
├── user/              # User management module
├── ingestion/         # Document ingestion module
├── global/            # Global utilities and configurations
└── db/                # Database migrations and seeds
```

## Features

- Role-based access control (RBAC)
- Document upload and management
- User authentication and authorization
- File storage with size limits
- Document metadata tracking
- API documentation with Swagger

## License

[MIT License](LICENSE)
