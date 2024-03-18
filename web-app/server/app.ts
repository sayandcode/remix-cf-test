import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from '../build/index';
import { ServerBuild } from '@remix-run/server-runtime';

export default function makeApp() {
  
  const app = express();

  app.get('/favicon.ico', (req, res) => {
    res.setHeader('Cache-Control', "s-maxage=43200")
    res.redirect(`/static/favicon.ico`);
  })

  // The /static/* routing is now configured on Cloudfront.
  // This saves us from having to use `assetStoreBaseUrl` as an env
  // variable
  // app.use('/static/*', (req, res) => {
  //   const params = req.originalUrl.slice('/static/'.length);
  //   res.redirect(`${assetStoreBaseUrl}/${params}`)
  // });

  const serverBuild = build as unknown as ServerBuild;
  app.all('*',
    createRequestHandler({
      build: serverBuild,

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