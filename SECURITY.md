# Security Policy

## Supported Versions

The following versions of this project are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send a detailed report to: **<security@dimasptra.my.id>** (or create a private security advisory on GitHub)
3. Include the following information:
   - Type of vulnerability (e.g., XSS, SQL Injection, CSRF, etc.)
   - Full path(s) of the affected source file(s)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if available)
   - Potential impact of the vulnerability

### What to Expect

- **Initial Response**: Within 48 hours of your report
- **Status Update**: Within 7 days with an assessment of the vulnerability
- **Resolution Timeline**: Critical vulnerabilities will be addressed within 14 days; others within 30 days

### After Reporting

1. We will acknowledge receipt of your report
2. We will investigate and validate the vulnerability
3. We will work on a fix and coordinate disclosure timing with you
4. We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

This project implements the following security measures:

### Authentication & Authorization

- JWT-based authentication with secure token handling
- Bcrypt password hashing with appropriate salt rounds
- Rate limiting on authentication endpoints
- Session management with secure cookie settings

### Input Validation & Sanitization

- Input validation on all user-provided data
- XSS protection through content sanitization
- SQL injection prevention via parameterized queries (Prisma ORM)
- CSRF protection on state-changing operations

### Infrastructure Security

- HTTPS enforcement in production
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Environment variable protection for sensitive data
- Regular dependency updates and vulnerability scanning

### Monitoring & Logging

- Security event logging
- Rate limiting and abuse detection
- Error handling that doesn't expose sensitive information

## Scope

### In Scope

- The main portfolio website and API
- Authentication and session management
- Data handling and storage
- Third-party integrations (GitHub, Spotify APIs)

### Out of Scope

- Third-party services and their vulnerabilities
- Social engineering attacks
- Physical security
- Denial of service attacks

## Security Updates

Security updates will be released as patch versions and announced through:

- GitHub Security Advisories
- Release notes

## Contact

For security-related inquiries:

- Email: <security@dimasptra.my.id>
- GitHub: [@infinitedim](https://github.com/infinitedim)

## Acknowledgments

We appreciate the security research community's efforts in helping keep this project secure. Contributors who responsibly disclose vulnerabilities will be acknowledged here (with permission).

---

Thank you for helping keep this project and its users safe!
