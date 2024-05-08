import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

const config = new pulumi.Config();
// export secret values
export const slackAPIToken = config.requireSecret("SLACK_API_TOKEN");
export const openaiAPIKey = config.requireSecret("OPENAI_API_KEY");

// Sns topic for slack events
const topic = new aws.sns.Topic("slackEventsTopic");

// ## Roles
// lambda role
const lambdaRole = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
      },
    ],
  },
});

// allow lambda to publish to sns
new aws.iam.RolePolicy("lambdaSNSPolicy", {
  role: lambdaRole,
  policy: pulumi.all([topic.arn]).apply(([topicArn]) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "sns:Publish",
          Resource: topicArn,
        },
      ],
    })
  ),
});

// attach policy to role
new aws.iam.RolePolicyAttachment("lambdaRoleAttach", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
});

// ## Lambda functions
// handler for slack events
const eventLambda = new aws.lambda.Function("eventLambda", {
  runtime: "nodejs18.x",
  role: lambdaRole.arn,
  handler: "index.handler",
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.FileAsset("./functions/dist/eventHandler.js"),
  }),
  timeout: 30,
  environment: {
    variables: {
      SLACK_API_TOKEN: config.requireSecret("SLACK_API_TOKEN"),
      OPENAI_API_KEY: config.requireSecret("OPENAI_API_KEY"),
    },
  },
});

// handler for quick replies
const quickReplyLambda = new aws.lambda.Function("quickReply", {
  runtime: aws.lambda.Runtime.Python3d8,
  role: lambdaRole.arn,
  handler: "quick_reply.handler",
  code: new pulumi.asset.AssetArchive({
    "quick_reply.py": new pulumi.asset.FileAsset(
      "./functions/python/quick_reply.py"
    ),
  }),
  environment: {
    variables: {
      TOPIC_ARN: topic.arn,
    },
  },
  timeout: 30,
});

// handler for interactive events
const interactiveLambda = new aws.lambda.Function("interactiveLambda", {
  runtime: "nodejs18.x",
  role: lambdaRole.arn,
  handler: "index.handler",
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.FileAsset(
      "./functions/dist/interactiveHandler.js"
    ),
  }),
  timeout: 30,
  environment: {
    variables: {
      SLACK_API_TOKEN: config.requireSecret("SLACK_API_TOKEN"),
    },
  },
});

// root handler
const root = new aws.lambda.CallbackFunction("root", {
  callback: async (ev, ctx) => {
    console.log("Verify Event Detected");
    console.log(JSON.stringify(ev));
    return {
      statusCode: 200,
      body: "Welcome to URS bot API!",
    };
  },
});

// Subscribe lambda to SNS topic
new aws.sns.TopicSubscription("eventLambdaSubscription", {
  topic: topic.arn,
  protocol: "lambda",
  endpoint: eventLambda.arn,
});

// Allow SNS to invoke lambda
new aws.lambda.Permission("snsInvokeEventLambda", {
  action: "lambda:InvokeFunction",
  function: eventLambda.name,
  principal: "sns.amazonaws.com",
  sourceArn: topic.arn,
});

const api = new apigateway.RestAPI("api", {
  routes: [
    {
      path: "/",
      method: "GET",
      eventHandler: root,
    },
    {
      path: "/slack-events",
      method: "POST",
      eventHandler: quickReplyLambda,
    },
    {
      path: "/slack-interactive",
      method: "POST",
      eventHandler: interactiveLambda,
    },
  ],
  binaryMediaTypes: ["application/json"],
  description: "API Gateway for Slack Events API",
});

export const url = api.url;
