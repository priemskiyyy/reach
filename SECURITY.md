# Security

Report a vulnerability privately through [GitHub's private vulnerability reporting](https://github.com/priemskiyyy/reach/security/advisories/new), not in a public issue. Include the package and its version, the adapter, endpoints and options involved, and the smallest example that shows the problem, with URLs that carry credentials, tokens, account identifiers and personal data removed.

Fixes go into the latest release of each package, as a new patch version with its changelog entry. The advisory is published once that release is on npm.

Reach decides nothing about access. A condition or an endpoint check says what the network evidence shows; it is never an authorization boundary, and a health check that passes proves nothing about the request an application sends next. Diagnostic events carry no scope key, and endpoint state keeps no response data, but what the application's own HTTP client logs or caches is up to that client.
