# Releasing the packages

All ten packages share one version line. Each has its own release tag, and one publishing workflow serves them all. Pushes and verification runs publish nothing.

The release tag uses the package name without its scope: `<name>-v<version>`, for example `reach-netinfo-v0.1.0` for `@priemskiyyy/reach-netinfo`, and `reach-v0.1.0` for the core. The publish workflow resolves the package from the tag, verifies its metadata and changelog entry, runs the test workflows, and publishes the verified tarball from `.artifacts/release/<package>/` with provenance after checking its checksum. It publishes the tarball that was tested, not a rebuild. Prereleases use the `next` dist-tag, and stable releases use `latest`.

Publish in dependency order. Dependents declare the matching minor as a peer dependency, so a dependent published before the core cannot be installed.

1. `@priemskiyyy/reach`
2. `@priemskiyyy/reach-browser`
3. `@priemskiyyy/reach-netinfo`
4. `@priemskiyyy/reach-expo-network`
5. `@priemskiyyy/reach-http`
6. `@priemskiyyy/reach-react`
7. `@priemskiyyy/reach-solid`
8. `@priemskiyyy/reach-vue`
9. `@priemskiyyy/reach-svelte`
10. `@priemskiyyy/reach-tanstack-query`

## Prepare a release

1. Update the package versions and their entries in `CHANGELOG.md` together. Date the entries, because `Unreleased` blocks publishing. An entry's heading is `## <package> <version> - <date>`, and `verify:release` parses it literally.
2. Run `pnpm check:release`. It needs no device, no credentials and no browser, and the packed consumer installs the framework peers from the npm registry, so it needs network access.
3. Merge into `main` and check GitHub Actions on that revision.
4. Create a GitHub release with the package's tag. Mark prerelease versions as prereleases.
5. Approve the publish job in the GitHub `npm` environment once its verification jobs pass.

Do not reuse a published version. Prepare a new patch version and changelog entry for a release fix.

## What the release checks do not cover

No release check runs an adapter on a device, an emulator or a simulator. The example tour drives Chromium offline and back with `pnpm test:examples`, a local Playwright check that no workflow runs, so run it by hand before a release. [The decision record](docs/decisions.md) lists what that leaves unverified. Before a stable release of an adapter, run it once by hand in a real application on each platform it maps, and say in the release notes what you ran.

### What was run for 0.1.0

Paste this into the GitHub release notes. [The verification matrix](docs/verification.md#run-on-an-android-emulator-and-an-ios-simulator) has the detail.

> On 2026-10-02 the Expo example app (Expo SDK 57, React Native 0.86.3) was run as Release builds on an Android emulator (Pixel_10, API 36) and an iOS 26.5 simulator (iPhone 17e), against the local fixture server, with `@priemskiyyy/reach-netinfo` over `@react-native-community/netinfo` 12.0.1 and `@priemskiyyy/reach-http`. On Android, airplane mode, Wi-Fi and mobile data were toggled, the app was sent to the background with the network changed, the endpoint was made to fail, and the runtime lease was cycled five times. On iOS the launch evidence, background and foreground, a request timeout and five lease cycles were checked. No physical device was used. Real cellular, captive portals, VPN, iOS network transitions and `@priemskiyyy/reach-expo-network` were not run.

Against the rule above, as of 2026-10-02:

- `@priemskiyyy/reach-netinfo` meets it on an Android emulator and an iOS simulator only. It has not been run on a physical device.
- `@priemskiyyy/reach-expo-network` does not meet it. It was not run on any platform. The example is on Expo SDK 57, the adapter's peer is `expo-network` 58.0.1 or later, and `npm view expo-network dist-tags` showed 58.x on the `next` tag only, with `latest` at 57.0.2.

## npm trusted publishers

All packages use the GitHub owner `priemskiyyy`, repository `reach`, workflow `publish.yml` and environment `npm`. Trusted publishing uses GitHub's short-lived OIDC identity, so the repository needs no npm token.

The first publication of a package requires an authenticated npm maintainer, because the package must exist before its trusted publisher can be configured. Do it for all ten at once, in order, and in this sequence:

1. Publish the verified tarballs by hand, before any tag exists.
2. Register the trusted publisher of every package.
3. Push the tags, after the packages are on npm.

Do not create a GitHub release for a version that was published by hand. The tag is enough. A release would start the publish workflow, which checks that npm's integrity matches its verified tarball and finishes without republishing, but the release adds nothing the tag does not.

Run `pnpm check:release` first, so that `.artifacts/release` holds the tarballs it verified, and publish those. Each package directory has its tarball and a `SHA256SUMS` file.

```sh
npm login

for name in reach reach-browser reach-netinfo reach-expo-network reach-http reach-react reach-solid reach-vue reach-svelte reach-tanstack-query; do
  (cd ".artifacts/release/@priemskiyyy/$name" && shasum -a 256 -c SHA256SUMS && npm publish ./*.tgz --access public --tag latest)
done
```

After the publishes, register the trusted publisher of each package, then require two-factor authentication and disallow tokens for it. `npm trust` needs npm 11.15 or later; older versions leave out the permission the registry requires and fail with a bare `400 Bad Request`. Check `npm --version` first.

```sh
for name in reach reach-browser reach-netinfo reach-expo-network reach-http reach-react reach-solid reach-vue reach-svelte reach-tanstack-query; do
  npm trust github "@priemskiyyy/$name" --file publish.yml --repository priemskiyyy/reach --environment npm --allow-publish
  npm access set mfa=publish "@priemskiyyy/$name"
done
```

Then tag the commit that was released and push the tags:

```sh
for name in reach reach-browser reach-netinfo reach-expo-network reach-http reach-react reach-solid reach-vue reach-svelte reach-tanstack-query; do
  git tag "$name-v<version>" && git push origin "$name-v<version>"
done
```

The initial publication by hand carries no provenance. Later versions, published by the workflow, include it.
