# Security Guidelines (OWASP-based)

**Purpose:** Prevent security vulnerabilities in this codebase. Based on OWASP Top 10 best practices.

**Primary Directive:** All code must be secure by default. When in doubt, choose the more secure option and explain reasoning.

---

## OWASP Top 10 Guidelines

### A01: Broken Access Control & A10: SSRF

**Principle of Least Privilege:**
- Default to most restrictive permissions
- Explicitly check user rights against required permissions
- Follow "deny by default" pattern

**SSRF Prevention:**
- Treat all user-provided URLs as untrusted
- Use strict allow-list validation for host, port, path
- Never fetch arbitrary URLs without validation

**Path Traversal:**
- Sanitize file paths from user input
- Prevent directory traversal (`../../etc/passwd`)
- Use secure path-building APIs

### A02: Cryptographic Failures

**Strong Algorithms:**
- ✅ Use Argon2 or bcrypt for password hashing
- ❌ Never use MD5 or SHA-1 for security
- ✅ AES-256 for encryption at rest

**Data in Transit:**
- Always default to HTTPS
- Validate TLS certificates

**Secret Management:**
- ❌ Never hardcode secrets (API keys, passwords, connection strings)
- ✅ Read from environment variables or secrets manager
- ✅ Use `.env.example` for placeholders, never commit `.env`

### A03: Injection

**SQL Injection:**
- ✅ Always use parameterized queries (prepared statements)
- ❌ Never concatenate user input into SQL strings
- Example:
  ```javascript
  // ✅ GOOD
  db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  // ❌ BAD
  db.exec(`SELECT * FROM users WHERE id = ${userId}`);
  ```

**Command Injection:**
- Use built-in functions with proper escaping
- Avoid shell execution with user input
- Example (Python): Use `shlex.quote()` or avoid shell entirely

**XSS Prevention:**
- ✅ Use `.textContent` (treats data as text)
- ⚠️ Use `.innerHTML` only with sanitization (DOMPurify)
- ✅ Context-aware output encoding
- Example:
  ```javascript
  // ✅ GOOD
  element.textContent = userInput;

  // ❌ BAD
  element.innerHTML = userInput;
  ```

### A05: Security Misconfiguration & A06: Vulnerable Components

**Secure Configuration:**
- Disable verbose errors in production
- Disable debug features in production
- Set security headers (CSP, HSTS, X-Content-Type-Options)

**Dependency Management:**
- Use latest stable versions
- Run `npm audit` (or equivalent) regularly
- Monitor for CVEs in dependencies

### A07: Identification & Authentication Failures

**Session Management:**
- Generate new session ID on login (prevent fixation)
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Strict`
- Implement sliding expiration with a reasonable TTL

**Brute Force Protection:**
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- Consider CAPTCHA for sensitive operations

### A08: Software and Data Integrity Failures

**Insecure Deserialization:**
- ⚠️ Never deserialize untrusted data without validation
- ✅ Prefer JSON over Pickle/serialized objects
- ✅ Implement strict type checking

**Supply Chain:**
- Verify integrity of third-party packages (checksums, signatures)
- Pin dependency versions in production
- Review transitive dependencies for known vulnerabilities

---

## General Security Guidelines

### Be Explicit About Security

When suggesting code that mitigates a security risk, state what you're protecting against:

```javascript
// ✅ GOOD: Explicit security reasoning
// Using parameterized query to prevent SQL injection
const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
```

### Educate During Code Reviews

When identifying vulnerabilities:
1. Explain the risk
2. Provide corrected code
3. Reference OWASP category
4. Link to incident log if a prior incident occurred

### Security Checklist for New Code

Before merging, verify:
- [ ] No hardcoded secrets
- [ ] User input is validated/sanitized
- [ ] SQL uses prepared statements
- [ ] Cache keys include user-specific identifiers (query params, not fragments)
- [ ] Auth checks are present for protected endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up-to-date
- [ ] Security headers are set

---

## Testing Security

### Manual Verification

- **Cache Isolation:** Use two different browsers/sessions, verify User A cannot see User B's cached data
- **Auth Bypass:** Try accessing protected endpoints without session cookie
- **Input Validation:** Send malformed/malicious input, verify proper error handling
- **SSRF:** Try fetching localhost/internal IPs, verify blocked

### Automated Checks

```bash
# Check dependencies for known vulnerabilities
npm audit          # Node.js
pip audit          # Python (requires pip-audit)
dotnet list package --vulnerable   # .NET

# Static analysis / linting
npm run typecheck  # TypeScript projects
npm run lint       # ESLint or equivalent

# Build verification
npm run build
```

---

## Project-Specific Patterns

<!-- Add your project's security patterns here. Examples of what to document:

- **Auth flow:** Session creation, token verification, cookie configuration
- **Cache key patterns:** How to build user-specific cache keys safely
- **Endpoint templates:** Standard structure for protected API routes
- **Secret rotation procedure:** Steps to rotate HMAC keys, API tokens, etc.
- **Platform-specific headers:** CSP, CORS, or other header configuration
-->

_No project-specific patterns documented yet._

---

## Incident Log

<!-- Document security incidents and lessons learned here. Template:

### YYYY-MM-DD — Incident Title
- **What happened:** Brief description of the vulnerability or breach
- **Impact:** What data/users were affected
- **Root cause:** Why it happened (e.g., URL fragments stripped by HTTP layer)
- **Fix applied:** What code/config change resolved it
- **Prevention:** Checklist or rule added to prevent recurrence
-->

_No incidents logged yet._

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [GitHub Security Advisories](https://github.com/advisories)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

---

**Last Updated:** _Update this date after each revision_

**Review Schedule:** After any security incident or quarterly
