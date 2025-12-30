# City of Bowie ADA Title II Compliance Project

[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Comprehensive accessibility compliance implementation for the City of Bowie, Maryland to meet federal ADA Title II requirements by April 24, 2026.

## Overview

This project provides a complete solution for achieving and maintaining WCAG 2.1 Level AA compliance across all public-facing digital content for a municipal government.

### Key Features

- **Automated Website Scanner** - Pa11y-based accessibility auditor with visual HTML reports
- **6-Phase Compliance Roadmap** - Structured implementation plan (12-18 months)
- **Hybrid Human-AI Architecture** - Expert consultants supported by AI efficiency
- **Custom Dashboard** - Power BI monitoring and reporting system
- **Document Remediation** - PDF and Office document accessibility services
- **Training Program** - Staff enablement for sustainable compliance

## Federal Deadline

**April 24, 2026** - All public entities must comply with ADA Title II web accessibility requirements.

## Project Structure

```
ada/
├── research/               # Strategic planning documents
│   ├── ada-compliance-roadmap.md
│   ├── tech-stack.md
│   ├── skills-inventory.md
│   ├── agent-architecture.md
│   └── proposal-framework.md
│
├── tools/
│   └── scanner/           # Website accessibility scanner
│       ├── scanner.js     # Main scanning tool
│       ├── package.json
│       └── reports/       # Generated scan results
│
├── CLAUDE.md              # Project memory and context
├── QUICK-START.md         # Getting started guide
└── PROJECT-SUMMARY.md     # Deliverables overview
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Internet connection (for website scanning)

### Installation

```bash
cd tools/scanner
npm install
```

### Run Website Scan

```bash
node scanner.js https://www.cityofbowie.org
```

This will:
1. Scan the target website for WCAG 2.1 AA compliance
2. Display results in the terminal
3. Generate detailed HTML and JSON reports in `reports/`

### View Results

Open the generated HTML report in your browser:
```bash
# Windows
start reports/scan-[timestamp].html

# Mac/Linux
open reports/scan-[timestamp].html
```

## Documentation

- [Quick Start Guide](QUICK-START.md) - Meeting prep and demo instructions
- [Project Summary](PROJECT-SUMMARY.md) - Complete deliverables overview
- [Deployment Guide](DEPLOYMENT-GUIDE.md) - Implementation instructions
- [Compliance Roadmap](research/ada-compliance-roadmap.md) - 6-phase implementation plan
- [Tech Stack](research/tech-stack.md) - Tools and technology decisions
- [Proposal Framework](research/proposal-framework.md) - Client presentation guide

## Key Deliverables

### Phase 1: Website Compliance (Months 1-4)
- Comprehensive accessibility audit
- Critical issue remediation
- WCAG 2.1 AA compliance
- Staff training

### Phase 2: Document Remediation (Months 3-8)
- Laserfiche inventory and assessment
- High-priority PDF remediation
- Accessible templates
- Document governance

### Phase 3: Monitoring Dashboard (Months 4-6)
- Custom Power BI dashboard
- Automated scanning integration
- Training tracking
- Vendor compliance monitoring

### Phase 4-6: Governance, Training, Sustainability
- Policy development
- Ongoing staff training
- Quarterly audits
- Vendor assessments

## Technology Stack

### Automated Testing
- **Pa11y** - Command-line accessibility testing
- **Axe DevTools** - Industry-standard WCAG validation
- **WAVE** - Visual accessibility checker
- **Lighthouse** - Chrome DevTools auditing

### Document Remediation
- **Adobe Acrobat Pro** - PDF accessibility
- **CommonLook PDF** - Professional remediation
- **PAC 2021** - PDF validation

### Monitoring & Reporting
- **Power BI** - Custom compliance dashboard
- **Express.js** - Web server for reports
- **Supabase** - Optional data storage

## Pricing Tiers

### Tier 1: Essential ($65K-75K)
- Website audit and remediation
- Basic training
- Monthly monitoring

### Tier 2: Comprehensive ($95K-110K) ⭐ Recommended
- Everything in Tier 1
- Document remediation
- Custom dashboard
- Advanced training

### Tier 3: Enterprise ($120K-150K)
- Everything in Tier 2
- Vendor assessments
- Policy development
- Quarterly audits (Year 1)

Plus ongoing dashboard management: $2,000-4,000/month

## Compliance Standards

- **ADA Title II** - Americans with Disabilities Act requirements for public entities
- **WCAG 2.1 Level AA** - Web Content Accessibility Guidelines
- **Section 508** - Federal accessibility standards

## Support

For questions or issues:
- Review the [Quick Start Guide](QUICK-START.md)
- Check scanner [README](tools/scanner/README.md)
- Contact project team

## License

MIT License - See [LICENSE](LICENSE) file for details

## Project Status

**Status**: ✅ Ready for Demo
**Phase**: Pre-Proposal / Proof-of-Concept
**Next Action**: Schedule meeting with City of Bowie IT leadership
**Last Updated**: December 2025

---

**Built with**: Node.js, Pa11y, Axe-core, Express.js, Power BI
**For**: City of Bowie, Maryland
**Deadline**: April 24, 2026
**Compliance Target**: WCAG 2.1 Level AA
