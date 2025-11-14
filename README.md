# lms-service-node

A Node.js TypeScript service that integrates with Fineract APIs using clean architecture principles. This is a wrapper to talk to Fineract LMS.

## Architecture

This project follows clean architecture with clear separation of concerns:

- **Routes**: API endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic layer
- **Repositories**: Data access abstraction
- **Database Services**: Database operations
- **Models**: Type definitions and data structures
- **Config**: Application configuration
- **Utils**: Shared utilities

## Project Structure

```
lms-service/
├── src/
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── database/         # Database services
│   ├── repositories/     # Data access layer
│   ├── models/           # Type definitions
│   ├── config/           # Configuration
│   ├── utils/            # Utilities
│   └── app.ts            # Application entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- TypeScript

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the service:
   ```bash
   npm start
   ```

### Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Design Principles

- **Object-Oriented**: All components use class-based design
- **Dependency Injection**: Using decorators (@injectable, @inject)
- **Type Safety**: Strict TypeScript with no loose primitives
- **Versioning**: All services/controllers are versioned (v1, v2, etc.)
- **Separation of Concerns**: Clear boundaries between layers

## API Integration

### Fineract Integration

The service integrates with Fineract APIs through dedicated abstraction layers:

- `fineract.service.v1.ts`: Third-party API calls
- `fineract.database.service.v1.ts`: Fineract-specific database operations
- `fineract.repo.v1.ts`: Fineract data repository

### LMS Logic

LMS-specific business logic is isolated in:

- `lms.controller.v1.ts`: LMS endpoints
- `lms.service.v1.ts`: LMS business logic
- `lms.database.service.v1.ts`: LMS database operations
- `lms.repo.v1.ts`: LMS data repository

## License

ISC
