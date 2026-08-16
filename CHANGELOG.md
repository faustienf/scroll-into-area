# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Releases before 1.1.0 predate this file; their history is in the git log.

## 1.1.0 — 2026-08-16

The alignment rules now follow `Element.scrollIntoView` rather than
approximating it. Two things need attention when upgrading, both detailed below:

- **`offset` is gone**, replaced by the container's `scroll-padding`. Code that
  passes it stops type-checking, and plain JavaScript that passes it loses the
  inset without any other sign.
- **`"start"` and `"end"` swap sides in RTL containers**, where they now mean
  what the platform means by them. Left-to-right containers are unaffected.

### Added

- The target's
  [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin)
  is honoured, as `scrollIntoView` honours it. Where `scroll-padding` reserves
  room in the container for everything scrolled into it, `scroll-margin` does it
  for one element — the `scroll-margin-top` on a heading that keeps anchor
  navigation from tucking it under a sticky header now applies to a
  programmatic scroll as well, instead of the two disagreeing silently.

  It grows the box alignment works with, so it counts for `"nearest"` too: a
  target whose margin is still covered gets scrolled the rest of the way. The
  two properties compose, and `scroll-margin` is physical, so on a right-to-left
  axis it is the right margin that applies to `"start"`. Unlike
  `scroll-padding`, the property accepts lengths only; percentages are invalid
  CSS and have no effect.

### Changed

- `"start"` and `"end"` are logical rather than physical. On the `x` axis they
  resolve against the container's `direction`, so in a `direction: rtl`
  container `"start"` is the right edge and `"end"` the left one, matching
  `scrollIntoView`'s `inline` option. Previously they always meant left and
  right, which was the opposite way round from the platform in RTL.

  `"center"` and `"nearest"` are symmetric and mean the same thing either way,
  with one exception: a target too large to fit falls back to `"start"`, and so
  lands against the right edge in RTL.

  The `y` axis is always top-to-bottom. Vertical writing modes, where the block
  axis is the horizontal one, are not resolved.

- `container` accepts `Element` instead of `HTMLElement`. Only
  `getBoundingClientRect` and the scroll accessors are used, so the narrower
  type was excluding SVG containers for no reason. Existing call sites keep
  compiling.

### Removed

- The `offset` option, in favour of the container's
  [`scroll-padding`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding).
  `offset: 80` becomes `scroll-padding-top: 80px` on the container.

  One number could not describe two axes: aligning both at once applied the same
  inset horizontally and vertically, so a call meant to clear an 80px sticky
  header also inset the horizontal position by 80px. Nor could it describe a
  header and a footer of different heights, since `"nearest"` narrowed both
  edges by the same amount.

  Alignment is now computed against the _optimal viewing region_ — the visible
  area inset by `scroll-padding` — which is what `scrollIntoView` aligns to. The
  four edges are independent, percentages resolve against the scrollport, and
  `auto` counts as none. This also corrects `"center"`, where the old option
  moved the target by the whole offset when only half of it separates the centre
  of the region from the centre of the container.

  Note that the browser applies `scroll-padding` only to its own scrolling —
  `scrollIntoView`, scroll snapping, anchor navigation — and never to
  assignments to `scrollTop`/`scrollLeft`. Since the scroll position is computed
  here, the property is read explicitly with `getComputedStyle`.

### Fixed

- Alignment is measured against the scrollport — the container's padding box
  minus any scrollbar — instead of the border box `getBoundingClientRect`
  reports. A container with a border landed the target underneath it by the
  border's width, `"nearest"` called a target hidden by the border visible and
  refused to scroll, and a vertical scrollbar shifted every horizontal
  alignment by its own width, which affects most scrollable containers. The
  scrollport is now read from `clientTop`/`clientLeft` and
  `clientHeight`/`clientWidth`; on a right-to-left container `clientLeft` covers
  a scrollbar sitting on the left as well. Percentage `scroll-padding` resolves
  against the scrollport too.

- `scroll-padding` values that together exceed the scrollport are reduced
  proportionally. They previously left an inverted region, in which every target
  counted as too large to fit, so `"nearest"` moved even a plainly visible one.

- `exports` resolved ESM type declarations for CJS consumers. The `types`
  condition sat above `require`, so it matched first and the nested
  `require.types` was never reached — `require("scroll-into-area")` got `.d.ts`
  (ESM) types for a `.cjs` implementation. Types are now declared inside the
  `import` and `require` conditions instead.

- Nothing is measured when neither `x` nor `y` is given. The call previously
  read both bounding rectangles before working out it had nothing to do.

### Build

- Replaced tsup with [tsdown](https://tsdown.dev), which supports TypeScript 7.
  Published file names are unchanged.
- TypeScript upgraded to 7.0; `easing-scroll` to 1.2.1.
- `publint` and `are-the-types-wrong` run on every build.
- Publishing moved to GitHub Actions on tag push, authenticated with npm trusted
  publishing over OIDC, so releases carry a provenance statement. `npm version`
  no longer publishes from a developer machine, and `prepublishOnly` refuses to.
- CI runs type checks, the test suite and the package validation on every pull
  request, across Node 22 and 24.
- Test coverage is measured with a 100% threshold on statements, branches,
  functions and lines.
- Dependabot keeps GitHub Actions and the toolchain current, with
  `easing-scroll` deliberately outside the grouped pull request.
- `example` is a workspace member that depends on `scroll-into-area` via
  `workspace:*` and builds it first, so the demo consumes the built package the
  way a published consumer does — which makes its type check a real test of the
  `exports` map.
- Dropped `.npmignore` in favour of the `files` field, which was already
  narrower and now also ships the changelog.
- Prettier formats the repository, checked in CI and on commit.

### Documentation

- README covers RTL containers, `scroll-padding`, and the behaviour of each
  alignment against the optimal viewing region.
- A Caveats section collects what the library does not do for you, starting with
  `scroll-behavior: smooth` on the container, which makes a scroll silently
  resolve without moving.
