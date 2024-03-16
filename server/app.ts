import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from '../build/index';
import { ServerBuild } from '@remix-run/server-runtime';

export default function makeApp() {
  
  const app = express();

  app.get('/favicon.ico', (req, res) => {
    res.redirect('https://sayandcode-remix-test-public.s3.ap-south-1.amazonaws.com/public-assets/favicon.ico');
  })

  app.use('/public-assets/*', (req, res) => {
    const params = req.originalUrl.slice('/public-assets/'.length);
    res.redirect(`https://sayandcode-remix-test-public.s3.ap-south-1.amazonaws.com/public-assets/${params}`)
  });

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