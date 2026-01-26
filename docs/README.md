# GitHub Ranked Documentation

> **Version**: 1.0.0  
> **Last Updated**: January 2026

## Overview

GitHub Ranked is a dynamic, gamified ranking system that transforms GitHub contribution statistics into competitive gaming-style rank badges (Iron → Challenger). This documentation provides comprehensive guidance for building, deploying, and maintaining the application.

---

## Documentation Index

### Core Documents

| Document                                             | Description                                                                                                               | Audience                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [GitHub Ranked.md](./GitHub%20Ranked.md)             | Original vision and research document. Covers theoretical foundations, statistical modeling, and gamification principles. | All stakeholders              |
| [Product Description.md](./Product%20Description.md) | User-facing product description. Features, user experience, competitive analysis.                                         | Product, Marketing            |
| [Architecture.md](./Architecture.md)                 | Technical architecture specification. System design, data flow, component specs.                                          | Engineers                     |
| [Implementation_Plan.md](./Implementation_Plan.md)   | Step-by-step implementation guide. Phases, code examples, acceptance criteria.                                            | Engineers                     |
| [TASKS.md](./TASKS.md)                               | Granular task breakdown with estimates. Project management and tracking.                                                  | Project Management, Engineers |
| [Quality Standards.md](./Quality%20Standards.md)     | Code quality, testing, security, and performance standards.                                                               | Engineers, QA                 |

### Technical Specifications

| Document                                                       | Description                                                                         | Audience                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| [API_Specification.md](./API_Specification.md)                 | Complete API documentation. Endpoints, data models, error handling, OpenAPI schema. | Engineers, API Consumers      |
| [GraphQL_Queries.md](./GraphQL_Queries.md)                     | GitHub GraphQL API queries. Exact queries, response types, error handling.          | Backend Engineers             |
| [Environment_Configuration.md](./Environment_Configuration.md) | Environment variables, secrets management, configuration guide.                     | DevOps, Engineers             |
| [Design_System.md](./Design_System.md)                         | Visual design specifications. Colors, typography, icons, themes.                    | Designers, Frontend Engineers |
| [CI_CD_Pipeline.md](./CI_CD_Pipeline.md)                       | CI/CD pipeline configuration. GitHub Actions, Vercel deployment, quality gates.     | DevOps, Engineers             |

### AI Development Guide

| Document                                   | Description                                                                                                                                                        | Audience                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| [AI_Instructions.md](./AI_Instructions.md) | Comprehensive context and behavioral guidelines for AI assistants working on this project. Includes quick reference tables, coding standards, and common pitfalls. | AI Assistants, Engineers |

---

## Quick Start

### For Developers

1. **Read the Architecture** → [Architecture.md](./Architecture.md)
2. **Set up environment** → [Environment_Configuration.md](./Environment_Configuration.md)
3. **Follow implementation** → [Implementation_Plan.md](./Implementation_Plan.md)
4. **Track tasks** → [TASKS.md](./TASKS.md)

### For Product/Design

1. **Understand the vision** → [GitHub Ranked.md](./GitHub%20Ranked.md)
2. **Review product details** → [Product Description.md](./Product%20Description.md)
3. **Design system** → [Design_System.md](./Design_System.md)

### For DevOps

1. **CI/CD setup** → [CI_CD_Pipeline.md](./CI_CD_Pipeline.md)
2. **Environment config** → [Environment_Configuration.md](./Environment_Configuration.md)
3. **Quality standards** → [Quality Standards.md](./Quality%20Standards.md)

### For AI Assistants

1. **Start here** → [AI_Instructions.md](./AI_Instructions.md)
2. **Understand vision** → [GitHub Ranked.md](./GitHub%20Ranked.md)
3. **Technical details** → [Architecture.md](./Architecture.md)
4. **Task tracking** → [TASKS.md](./TASKS.md)

---

## Document Relationships

```
                           ┌─────────────────────┐
                           │   GitHub Ranked.md  │
                           │   (Vision/Research) │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │Product Description│ │Architecture.md│ │ Quality Standards │
         │      (What)       │ │   (How)       │ │    (Why)         │
         └────────┬─────────┘ └──────┬────────┘ └────────┬─────────┘
                  │                  │                    │
                  │    ┌─────────────┼─────────────┐      │
                  │    │             │             │      │
                  │    ▼             ▼             ▼      │
                  │ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
                  │ │API Spec │ │Design   │ │Env      │   │
                  │ │         │ │System   │ │Config   │   │
                  │ └────┬────┘ └────┬────┘ └────┬────┘   │
                  │      │           │           │        │
                  │      └───────────┼───────────┘        │
                  │                  │                    │
                  │                  ▼                    │
                  │    ┌─────────────────────────┐        │
                  │    │  Implementation Plan    │        │
                  │    │                         │        │
                  │    └───────────┬─────────────┘        │
                  │                │                      │
                  │                ▼                      │
                  │    ┌─────────────────────────┐        │
                  └───►│       TASKS.md          │◄───────┘
                       │                         │
                       └───────────┬─────────────┘
                                   │
                                   ▼
                       ┌─────────────────────────┐
                       │   CI/CD Pipeline        │
                       │   (Execution)           │
                       └─────────────────────────┘
```

---

## Key Specifications Summary

### Ranking System

| Tier        | Elo Range | Percentile       |
| ----------- | --------- | ---------------- |
| Iron        | 0-599     | Bottom 20%       |
| Bronze      | 600-899   | Top 80%          |
| Silver      | 900-1199  | Top 60%          |
| Gold        | 1200-1499 | Top 40% (Median) |
| Platinum    | 1500-1699 | Top 20%          |
| Emerald     | 1700-1999 | Top 10%          |
| Diamond     | 2000-2399 | Top 2.5%         |
| Master      | 2400-2599 | Top 0.5%         |
| Grandmaster | 2600-2999 | Top 0.1%         |
| Challenger  | 3000+     | Top 0.02%        |

### Metric Weights

| Metric             | Weight | Rationale                     |
| ------------------ | ------ | ----------------------------- |
| Merged PRs         | 40     | Gold standard of contribution |
| Code Reviews       | 30     | High-value collaboration      |
| Issues Closed      | 20     | Problem-solving indicator     |
| Commits            | 10     | Low weight prevents farming   |
| Stars (capped 500) | 5      | Social proof multiplier       |

### Technology Stack

| Component     | Technology               |
| ------------- | ------------------------ |
| Framework     | Next.js 16+ (App Router) |
| Runtime       | Vercel Edge Functions    |
| SVG Rendering | Vercel Satori            |
| Cache         | Upstash Redis            |
| Language      | TypeScript 5.3+          |
| Testing       | Vitest, Playwright       |
| CI/CD         | GitHub Actions, Vercel   |

---

## Document Version History

| Version | Date         | Changes                       |
| ------- | ------------ | ----------------------------- |
| 1.0.0   | January 2026 | Initial documentation release |

---

## Contributing to Documentation

When updating documentation:

1. **Keep documents in sync** - When changing Architecture.md, update related documents
2. **Use consistent formatting** - Follow existing markdown conventions
3. **Update timestamps** - Update "Last Updated" when making changes
4. **Cross-reference** - Link to related documents where appropriate
5. **Add to index** - Add new documents to this index

---

## Contact

For questions about this documentation:

- Create an issue in the repository
- Contact the maintainers

---

## License

This project and documentation are licensed under the MIT License.
