# Dependency Security & Vulnerability Auditing

This document guides developers on how to audit, review, and patch security vulnerabilities in Vivu's dependencies.

## 1. Running Security Audits
To inspect packages for security advisories, run:
```bash
pnpm audit
```

## 2. Handling Vulnerabilities
1. **Audit Check**: Run `pnpm audit` to check for security alerts.
2. **Minor Updates**: Run `pnpm update --depth <number>` to patch dependencies without introducing breaking major releases.
3. **Selective Overrides**: If a nested transitive dependency is vulnerable and cannot be updated easily, add it to the `pnpm.overrides` section in the root `package.json` to force pnpm to resolve it to a safe version.
4. **Major Version Cautions**: Do not upgrade major versions directly into production without verifying compatibility and verifying all tests pass.

## 3. Current Security Overrides

- `@qdrant/js-client-rest>undici` is pinned to a patched `6.x` release.
- `testcontainers>undici` is pinned to a patched `7.x` release.

These overrides keep `pnpm audit` clean without forcing unrelated major upgrades of Qdrant or Testcontainers.
