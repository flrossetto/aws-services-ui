import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { SQSClient, ListQueuesCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, CreateQueueCommand, DeleteQueueCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3_CONFIG, SQS_CONFIG, DYNAMODB_CONFIG } from '../config/awsConfig';

const s3Client = new S3Client(S3_CONFIG);
const sqsClient = new SQSClient(SQS_CONFIG);
const dynamoDBClient = new DynamoDBClient(DYNAMODB_CONFIG);
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

// S3 Services
export const s3Service = {
  listBuckets: async () => {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    return response.Buckets || [];
  },

  listObjects: async (bucketName: string) => {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3Client.send(command);
    return response.Contents || [];
  },

  uploadObject: async (bucketName: string, key: string, file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type
    });
    await s3Client.send(command);
    return { bucketName, key };
  },

  downloadObject: async (bucketName: string, key: string) => {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);
    return response.Body;
  },

  deleteObject: async (bucketName: string, key: string) => {
    const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
    await s3Client.send(command);
  },

  createBucket: async (bucketName: string) => {
    const command = new CreateBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
  },

  deleteBucket: async (bucketName: string) => {
    const command = new DeleteBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
  }
};

// SQS Services
export const sqsService = {
  listQueues: async () => {
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);
    return response.QueueUrls || [];
  },

  sendMessage: async (queueUrl: string, message: string) => {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message
    });
    await sqsClient.send(command);
  },

  receiveMessages: async (queueUrl: string, maxMessages: number = 10) => {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 5
    });
    const response = await sqsClient.send(command);
    return response.Messages || [];
  },

  deleteMessage: async (queueUrl: string, receiptHandle: string) => {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    });
    await sqsClient.send(command);
  },

  createQueue: async (queueName: string) => {
    const command = new CreateQueueCommand({ QueueName: queueName });
    const response = await sqsClient.send(command);
    return response.QueueUrl;
  },

  deleteQueue: async (queueUrl: string) => {
    const command = new DeleteQueueCommand({ QueueUrl: queueUrl });
    await sqsClient.send(command);
  }
};

// DynamoDB Services
export const dynamoDBService = {
  listTables: async () => {
    const command = new ListTablesCommand({});
    const response = await dynamoDBClient.send(command);
    return response.TableNames || [];
  },

  createTable: async (tableName: string, keySchema: any, attributeDefinitions: any) => {
    const command = new CreateTableCommand({
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST'
    });
    await dynamoDBClient.send(command);
  },

  deleteTable: async (tableName: string) => {
    const command = new DeleteTableCommand({ TableName: tableName });
    await dynamoDBClient.send(command);
  },

  describeTable: async (tableName: string) => {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoDBClient.send(command);
    return response.Table;
  },

  // Document Client operations
  putItem: async (tableName: string, item: any) => {
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });
    await dynamoDBDocClient.send(command);
  },

  getItem: async (tableName: string, key: any) => {
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    });
    const response = await dynamoDBDocClient.send(command);
    return response.Item;
  },

  updateItem: async (tableName: string, key: any, updateExpression: string, expressionAttributeValues: any) => {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    const response = await dynamoDBDocClient.send(command);
    return response.Attributes;
  },

  deleteItem: async (tableName: string, key: any) => {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key
    });
    await dynamoDBDocClient.send(command);
  },

  scanItems: async (tableName: string) => {
    const command = new ScanCommand({ TableName: tableName });
    const response = await dynamoDBDocClient.send(command);
    return response.Items || [];
  },

  queryItems: async (tableName: string, keyConditionExpression: string, expressionAttributeValues: any) => {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
    const response = await dynamoDBDocClient.send(command);
    return response.Items || [];
  }
};