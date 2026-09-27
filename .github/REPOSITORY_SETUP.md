# Repository setup

The repository is [priemskiyyy/reach](https://github.com/priemskiyyy/reach). These settings complement the files checked into the project. Adding the files enables none of them.

## Discovery

Use a concise About description and topics that match the packages. Suggested topics: `network`, `connectivity`, `offline`, `reachability`, `netinfo`, `expo`, `react-native`, `react`, `tanstack-query`, `typescript`.

## Contributions and releases

- Issue forms and the pull request template are in `.github`.
- Enable private vulnerability reporting in the Security settings if a maintainer can monitor it.
- Configure branch protection or a ruleset after the required checks have run once: `packages-test`, `packages-verify` and `common-format`.
- Create the `npm` environment with a required reviewer. The publish job waits for that approval.
- Follow [RELEASING.md](../RELEASING.md) for publication, including the manual first publication that trusted publishing needs.
