import json
import boto3
import os


def handler(event, context):
    sns = boto3.client("sns")
    topic_arn = os.environ["TOPIC_ARN"]

    try:
        response = sns.publish(TopicArn=topic_arn, Message=json.dumps(event["body"]))
        print("Message pushed to SNS", response)
        return {"statusCode": 200, "body": "Message pushed to SNS"}
    except Exception as e:
        print("Failed to publish message", str(e))
        return {"statusCode": 500, "body": "Failed to process your request"}
