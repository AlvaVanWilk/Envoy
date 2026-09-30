// Which copy of the app this is. The copy in the test folder on the web
// space is marked 'test' while it is uploaded (see the workflow in
// .github/workflows). The test copy keeps its data apart from the real app,
// is called "Envoy Test" and shows a small "Test" sign.
export const STAGE = 'live';
export const IS_TEST = STAGE === 'test';
export const APP_NAME = IS_TEST ? 'Envoy Test' : 'Envoy';
