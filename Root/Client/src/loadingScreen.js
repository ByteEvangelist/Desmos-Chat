console.log('loading screen');
document.body.innerHTML = `
  <div>
    <div><p>Loading</p></div>
  </div>
`;

import(
  /* webpackPrefetch: true */
  /* webpackChunkName: "loader" */
  './loader'
).then((loader) => {
  loader.startLoader();
});
