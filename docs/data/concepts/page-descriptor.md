# Page Descriptor

## Markup generation with `getContent`

If a page descriptor must export a function `getContent` that returns the markup of the page. This is where you use a template engine (like pug, or simple js template strings) or a UI framework (like preact or vue).

This function will recive the data object you returned in data fetching methods (`getStaticData` or `getDynamicData`)

## Data fetching

A page descriptor can define multiple methods that do data fetching

### `getStaticData` method

If you export a function `getStaticData`, frugal will generate the page at build time.
