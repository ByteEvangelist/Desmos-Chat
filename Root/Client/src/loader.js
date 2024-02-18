export function startLoader() {
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "main" */
    './main.js'
  ).then((main) => {
    main.Start();
  });
}
