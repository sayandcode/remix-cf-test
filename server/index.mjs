import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from '../build/index.js';

function makeApp() {
  const app = express();

  app.use(express.static('public'));

  app.all('*',
    createRequestHandler({
      build,

      // return anything you want here to be available as `context` in your
      // loaders and actions. This is where you can bridge the gap between Remix
      // and your server
      getLoadContext() {
        return {}
      }
    })
  );

  return app;
}

const app = makeApp();

app.listen(3000, () => {
  console.log("Listening at port 3000");
})