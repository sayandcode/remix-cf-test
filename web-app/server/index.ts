import { LambdaFunctionURLHandler } from "aws-lambda";
import makeApp from "./app";
import ServerlessHttp from 'serverless-http'

export const handler: LambdaFunctionURLHandler = (event, context) => {
  const app = makeApp();
  const serverlessInstance = ServerlessHttp(app);
  return serverlessInstance(event, context);
}

  // const app = makeApp();
  // app.listen(3000)