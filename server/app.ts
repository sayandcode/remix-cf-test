import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from '../build/index';
import { ServerBuild } from '@remix-run/server-runtime';

export default function makeApp() {
  
  const app = express();

  app.use(express.static('public'));

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