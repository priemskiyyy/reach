# Repository setup

The repository is [priemskiyyy/reach](https://github.com/priemskiyyy/reach). These settings complement the files checked into the project. Adding the files enables none of them.

## Discovery

Use a concise About description and topics that match the packages. Suggested topics: `network`, `connectivity`, `offline`, `reachability`, `netinfo`, `expo`, `react-native`, `react`, `tanstack-query`, `typescript`.

## Contributions and releases

- Issue forms and the pull request template are in `.github`.
- Enable private vulnerability reporting in the Security settings before the first release. It is required: `SECURITY.md` sends every report to its advisory form, and that form does not exist until the setting is on.
- Configure branch protection or a ruleset after the required checks have run once. A required check is matched by its job name, not its workflow name, so require these exact contexts: `format`, `verify`, `test (node 22.18.0, react 19.2.0)` and `test (node 24, react 19.2.8)`. They come from the explicit `name:` of each job in `common.format.yml`, `packages.verify.yml` and `packages.test.yml`, so change one only together with the rule.
- Do not require the `docs` check. `docs.test.yml` runs only on pull requests that touch the documentation, the examples, the packages or their tooling, so on any other pull request the required check would never report and the merge would wait for it forever. The publish workflow runs it for every release.
- Create the `npm` environment with a required reviewer. The publish job waits for that approval.
- Follow [RELEASING.md](../RELEASING.md) for publication, including the manual first publication of all ten packages in dependency order that trusted publishing needs, and the tags that follow it.
