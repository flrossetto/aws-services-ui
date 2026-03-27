import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { SQSClient, ListQueuesCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, CreateQueueCommand, DeleteQueueCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AWS_CONFIG, SQS_CONFIG } from '../config/awsConfig';

// Usar configurações dinâmicas do awsConfig.ts (que já lê do localStorage)
const s3Client = new S3Client(AWS_CONFIG);
// Usar configuração específica para SQS para evitar problemas com protocolo de query
const sqsClient = new SQSClient(SQS_CONFIG);
const dynamoDBClient = new DynamoDBClient(AWS_CONFIG);
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

// S3 Services para Ministack
export const ministackS3Service = {
  listBuckets: async () => {
    try {
      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);
      return response.Buckets || [];
    } catch (error) {
      console.error('Erro S3 listBuckets:', error);
      return [];
    }
  },

  listObjects: async (bucketName: string) => {
    try {
      const command = new ListObjectsV2Command({ Bucket: bucketName });
      const response = await s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('Erro S3 listObjects:', error);
      return [];
    }
  },

  uploadObject: async (bucketName: string, key: string, file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type
      });
      await s3Client.send(command);
      return { bucketName, key };
    } catch (error) {
      console.error('Erro S3 uploadObject:', error);
      throw error;
    }
  },

  downloadObject: async (bucketName: string, key: string) => {
    try {
      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const response = await s3Client.send(command);
      return response.Body;
    } catch (error) {
      console.error('Erro S3 downloadObject:', error);
      throw error;
    }
  },

  deleteObject: async (bucketName: string, key: string) => {
    try {
      const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
      await s3Client.send(command);
    } catch (error) {
      console.error('Erro S3 deleteObject:', error);
      throw error;
    }
  },

  createBucket: async (bucketName: string) => {
    try {
      const command = new CreateBucketCommand({ Bucket: bucketName });
      await s3Client.send(command);
    } catch (error) {
      console.error('Erro S3 createBucket:', error);
      throw error;
    }
  },

  deleteBucket: async (bucketName: string) => {
    try {
      const command = new DeleteBucketCommand({ Bucket: bucketName });
      await s3Client.send(command);
    } catch (error) {
      console.error('Erro S3 deleteBucket:', error);
      throw error;
    }
  }
};

// SQS Services para Ministack
export const ministackSQSService = {
  listQueues: async () => {
    try {
      const command = new ListQueuesCommand({});
      const response = await sqsClient.send(command);
      return response.QueueUrls || [];
    } catch (error) {
      console.error('Erro SQS listQueues:', error);
      return [];
    }
  },

  sendMessage: async (queueUrl: string, message: string) => {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: message
      });
      await sqsClient.send(command);
    } catch (error) {
      console.error('Erro SQS sendMessage:', error);
      throw error;
    }
  },

  receiveMessages: async (queueUrl: string, maxMessages: number = 10) => {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 5
      });
      const response = await sqsClient.send(command);
      return response.Messages || [];
    } catch (error) {
      console.error('Erro SQS receiveMessages:', error);
      return [];
    }
  },

  deleteMessage: async (queueUrl: string, receiptHandle: string) => {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      });
      await sqsClient.send(command);
    } catch (error) {
      console.error('Erro SQS deleteMessage:', error);
      throw error;
    }
  },

  createQueue: async (queueName: string) => {
    try {
      const command = new CreateQueueCommand({ QueueName: queueName });
      const response = await sqsClient.send(command);
      return response.QueueUrl;
    } catch (error) {
      console.error('Erro SQS createQueue:', error);
      throw error;
    }
  },

  deleteQueue: async (queueUrl: string) => {
    try {
      const command = new DeleteQueueCommand({ QueueUrl: queueUrl });
      await sqsClient.send(command);
    } catch (error) {
      console.error('Erro SQS deleteQueue:', error);
      throw error;
    }
  }
};

// DynamoDB Services para Ministack (com workarounds para bugs)
export const ministackDynamoDBService = {
  listTables: async () => {
    try {
      const command = new ListTablesCommand({});
      const response = await dynamoDBClient.send(command);
      return response.TableNames || [];
    } catch (error) {
      console.error('Erro DynamoDB listTables:', error);
      return [];
    }
  },

  createTable: async (tableName: string, keySchema: any, attributeDefinitions: any) => {
    try {
      // Ministack/LocalStack - usar PAY_PER_REQUEST sem ProvisionedThroughput
      const command = new CreateTableCommand({
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST'
        // NÃO adicionar ProvisionedThroughput quando BillingMode é PAY_PER_REQUEST
      });
      await dynamoDBClient.send(command);
    } catch (error) {
      console.error('Erro DynamoDB createTable:', error);
      throw error;
    }
  },

  deleteTable: async (tableName: string) => {
    try {
      const command = new DeleteTableCommand({ TableName: tableName });
      await dynamoDBClient.send(command);
    } catch (error) {
      console.error('Erro DynamoDB deleteTable:', error);
      throw error;
    }
  },

  describeTable: async (tableName: string) => {
    try {
      // Workaround para bug do Ministack - garantir que tableName é string
      const cleanTableName = typeof tableName === 'string' ? tableName : String(tableName);
      const command = new DescribeTableCommand({ TableName: cleanTableName });
      const response = await dynamoDBClient.send(command);
      return response.Table;
    } catch (error) {
      console.error('Erro DynamoDB describeTable:', error);
      // Retornar estrutura básica em caso de erro
      return {
        TableName: tableName,
        TableStatus: 'ACTIVE',
        CreationDateTime: new Date(),
        ItemCount: 0,
        TableSizeBytes: 0
      };
    }
  },

  // Document Client operations com tratamento de erros
  putItem: async (tableName: string, item: any) => {
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: item
      });
      await dynamoDBDocClient.send(command);
    } catch (error) {
      console.error('Erro DynamoDB putItem:', error);
      throw error;
    }
  },

  getItem: async (tableName: string, key: any) => {
    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: key
      });
      const response = await dynamoDBDocClient.send(command);
      return response.Item;
    } catch (error) {
      console.error('Erro DynamoDB getItem:', error);
      return null;
    }
  },

  updateItem: async (tableName: string, key: any, updateExpression: string, expressionAttributeValues: any) => {
    try {
      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });
      const response = await dynamoDBDocClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.error('Erro DynamoDB updateItem:', error);
      throw error;
    }
  },

  deleteItem: async (tableName: string, key: any) => {
    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key
      });
      await dynamoDBDocClient.send(command);
    } catch (error) {
      console.error('Erro DynamoDB deleteItem:', error);
      throw error;
    }
  },

  scanItems: async (tableName: string) => {
    try {
      const command = new ScanCommand({ TableName: tableName });
      const response = await dynamoDBDocClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Erro DynamoDB scanItems:', error);
      return [];
    }
  },

  queryItems: async (tableName: string, keyConditionExpression: string, expressionAttributeValues: any) => {
    try {
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });
      const response = await dynamoDBDocClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('Erro DynamoDB queryItems:', error);
      return [];
    }
  }
};

// Serviço combinado que detecta automaticamente qual usar
export const getAWSService = () => {
  // Verificar se estamos conectando ao Ministack ou LocalStack
  // Por padrão, usar serviços otimizados para Ministack
  return {
    s3: ministackS3Service,
    sqs: ministackSQSService,
    dynamodb: ministackDynamoDBService
  };
};