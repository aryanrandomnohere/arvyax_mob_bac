import serverless from "serverless-http";
import app from "./app.js";
import type {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";

// Configure serverless-http with binary data support
const handler = serverless(app, {
  binary: [
    "image/*",
    "audio/*",
    "video/*",
    "application/octet-stream",
    "multipart/form-data",
  ],
  request: (request: any, event: any, context: any) => {
    request.context = context;
    request.event = event;
  },
});

// Lambda handler wrapper
const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log("Lambda Event:", {
      httpMethod: event.httpMethod,
      path: event.path,
      headers: event.headers ? Object.keys(event.headers) : [],
      bodyLength: event.body ? event.body.length : 0,
      isBase64Encoded: event.isBase64Encoded,
    });

    const result = (await handler(event, context)) as APIGatewayProxyResult;

    console.log("Lambda Response:", {
      statusCode: result.statusCode,
      headers: result.headers ? Object.keys(result.headers) : [],
      bodyLength: result.body ? result.body.length : 0,
    });

    return result;
  } catch (error: any) {
    console.error("Lambda handler error:", {
      message: error.message,
      stack: error.stack,
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: event.headers,
      },
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export { lambdaHandler };
