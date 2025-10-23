# Waste Compliance Agent

AI-powered waste compliance and logistics platform for hazardous waste
management. Automates EPA waste profiling, facility routing, and manifest
tracking to reduce compliance risk and logistics costs.

## Problem Statement

Hazardous waste disposal is a high-stakes, manual process plagued by complex
compliance requirements:

- **100+ page waste profiles** must be created for each waste type
- **Federal manifest tracking** (EPA RCRA) with strict requirements
- **Six-figure fines** for a single compliance mistake
- **Complex routing** across approved facilities with varying capabilities and
  pricing

## Solution

The Waste Compliance Agent automates the entire compliance and logistics
workflow:

1. **Monitors & Profiles**: Upload lab reports → AI classifies waste → Generates
   compliant EPA waste profile
2. **Optimizes & Routes**: Finds the most cost-effective approved disposal
   facility and route
3. **Acts**: Manages electronic manifests and creates digital audit trails

## Features (MVP)

- ✅ **Waste Classification**: AI-powered analysis of lab reports
- ✅ **EPA Waste Profile Generation**: Automated profile creation with proper
  RCRA codes
- ✅ **Facility Matching**: Search approved disposal facilities by waste type
  and location
- ✅ **Route Optimization**: Cost-effective and compliant routing
- ✅ **Electronic Manifest System**: Digital tracking and signatures
- ✅ **Audit Trail**: Immutable compliance records

## Tech Stack

- **Backend**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+
- **AI Model**: Anthropic Claude (configurable)
- **Testing**: Jest + Supertest
- **Deployment**: Docker + Docker Compose

## Project Structure

```
waste-compliance-agent/
├── src/
│   ├── server.js                 # Express server
│   ├── routes/                   # API endpoints
│   │   ├── wasteProfile.js
│   │   ├── facility.js
│   │   └── manifest.js
│   ├── services/                 # Business logic
│   │   ├── wasteClassifier.js
│   │   ├── facilityMatcher.js
│   │   └── manifestGenerator.js
│   ├── middleware/               # Express middleware
│   │   └── errorHandler.js
│   ├── utils/                    # Shared utilities
│   │   └── logger.js
│   └── db/                       # Database
│       └── schema.sql
├── tests/                        # Integration tests
├── docker/                       # Docker configurations
├── CLAUDE.md                     # Development guidelines
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15+ (or use Docker)
- AI model API key (Anthropic Claude recommended)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd waste-compliance-agent
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database (if using Docker):

```bash
cd docker
docker-compose up -d db
```

5. Initialize database schema:

```bash
psql -h localhost -U postgres -d waste_compliance -f src/db/schema.sql
```

### Development

Run in development mode with auto-reload:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

### Docker Deployment

Build and run with Docker Compose:

```bash
cd docker
export DB_PASSWORD=your_secure_password
docker-compose up -d
```

## API Endpoints

### Waste Profiles

- `POST /api/waste-profiles/classify` - Classify waste from lab report
- `POST /api/waste-profiles/generate` - Generate EPA waste profile

### Facilities

- `POST /api/facilities/search` - Search approved disposal facilities
- `POST /api/facilities/route` - Calculate optimal route

### Manifests

- `POST /api/manifests` - Create electronic manifest
- `GET /api/manifests/:manifestId` - Track manifest status

## Development Guidelines

This project follows strict development best practices defined in
[CLAUDE.md](./CLAUDE.md):

- **TDD**: Test-driven development for all features
- **Simple functions**: Prefer composable, testable functions over classes
- **Compliance-first**: Never auto-approve without human review
- **Audit everything**: All AI decisions are logged with full audit trail

### Quick Reference

- `qnew` - Review all best practices before coding
- `qplan` - Analyze plan consistency with codebase
- `qcode` - Implement with tests, linting, formatting
- `qcheck` - Perform skeptical code review

## Security & Compliance

- **CS-1**: Never auto-approve waste profiles without human review
- **CS-2**: Log all AI decisions with full audit trail
- **CS-3**: Validate all EPA waste codes against official RCRA database
- **CS-4**: Flag potential compliance risks immediately
- **CS-5**: Include confidence scores for all AI classifications
- **CS-6**: Never delete historical compliance records

## Roadmap

### Phase 1 (Current - MVP)

- [x] Backend API structure
- [ ] Waste classification AI integration
- [ ] EPA waste profile generation
- [ ] Basic facility database and search
- [ ] Electronic manifest creation
- [ ] Audit trail system

### Phase 2 (Future)

- [ ] Frontend dashboard for EHS directors
- [ ] Real-time manifest tracking
- [ ] Integration with EPA e-Manifest system
- [ ] Advanced route optimization algorithms
- [ ] Multi-tenant support

### Phase 3 (Future)

- [ ] Mobile app for field workers
- [ ] Automated pricing negotiation
- [ ] Predictive compliance risk analysis
- [ ] Integration with lab equipment (LIMS)

## Contributing

1. Follow the guidelines in [CLAUDE.md](./CLAUDE.md)
2. Write tests for all new features
3. Ensure linting and formatting pass
4. Use Conventional Commits format

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
