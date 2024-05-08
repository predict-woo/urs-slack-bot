import json
import boto3
import os

lambda_client = boto3.client("lambda")


def handler(event, context):
    # Name or ARN of the Lambda function you want to invoke
    function_name = os.environ["TARGET_LAMBDA_ARN"]

    try:
        # Asynchronously invoking another Lambda function
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="Event",  # Asynchronous invocation
            Payload=json.dumps(event["body"]),  # Passing the body of the event
        )
        print("Lambda function invoked", response)
        return {"statusCode": 200, "body": "Lambda function invoked asynchronously"}
    except Exception as e:
        print("Failed to invoke lambda function", str(e))
        return {"statusCode": 500, "body": "Failed to process your request"}
