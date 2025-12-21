import serverless from "serverless-http";
import app from "./app.js";

const handler = serverless(app, {
  binary: [
    "image/*",
    "audio/*",
    "video/*",
    "application/octet-stream",
    "multipart/form-data",
  ],
  request: (request, event, context) => {
    request.context = context;
    request.event = event;
  },
});

const lambdaHandler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};

export { lambdaHandler };
