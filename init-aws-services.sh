#!/bin/bash

export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1

echo "Aguardando AWS services iniciar..."
sleep 5

echo "Testando conexão com AWS services..."
curl -f http://aws-services:4566/health || exit 1

echo "Criando buckets S3 de teste..."
aws --endpoint-url=http://aws-services:4566 s3 mb s3://test-bucket-1 || echo "Bucket já existe ou erro"
aws --endpoint-url=http://aws-services:4566 s3 mb s3://test-bucket-2 || echo "Bucket já existe ou erro"

echo "Criando filas SQS de teste..."
aws --endpoint-url=http://aws-services:4566 sqs create-queue --queue-name test-queue-1 || echo "Fila já existe ou erro"
aws --endpoint-url=http://aws-services:4566 sqs create-queue --queue-name test-queue-2 || echo "Fila já existe ou erro"

echo "Criando tabelas DynamoDB de teste (com schema simplificado)..."
# Schema simplificado para AWS services
aws --endpoint-url=http://aws-services:4566 dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST || echo "Tabela já existe ou erro"

aws --endpoint-url=http://aws-services:4566 dynamodb create-table \
    --table-name Products \
    --attribute-definitions \
        AttributeName=productId,AttributeType=S \
    --key-schema \
        AttributeName=productId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST || echo "Tabela já existe ou erro"

echo "Inserindo dados de exemplo no DynamoDB..."
aws --endpoint-url=http://aws-services:4566 dynamodb put-item \
    --table-name Users \
    --item '{"id": {"S": "1"}, "name": {"S": "John Doe"}, "email": {"S": "john@example.com"}}' || echo "Erro ao inserir item"

aws --endpoint-url=http://aws-services:4566 dynamodb put-item \
    --table-name Products \
    --item '{"productId": {"S": "P001"}, "name": {"S": "Laptop"}, "price": {"N": "999.99"}}' || echo "Erro ao inserir item"

echo "Enviando mensagens de exemplo para SQS..."
QUEUE_URL=$(aws --endpoint-url=http://aws-services:4566 sqs get-queue-url --queue-name test-queue-1 --query 'QueueUrl' --output text 2>/dev/null || echo "")
if [ ! -z "$QUEUE_URL" ]; then
  aws --endpoint-url=http://aws-services:4566 sqs send-message --queue-url $QUEUE_URL --message-body "Mensagem de teste 1" || echo "Erro ao enviar mensagem"
  aws --endpoint-url=http://aws-services:4566 sqs send-message --queue-url $QUEUE_URL --message-body "Mensagem de teste 2" || echo "Erro ao enviar mensagem"
fi

echo "Criando arquivo de exemplo no S3..."
echo "Este é um arquivo de teste para o S3" > /tmp/test-file.txt
aws --endpoint-url=http://aws-services:4566 s3 cp /tmp/test-file.txt s3://test-bucket-1/subpasta/test-file.txt || echo "Erro ao copiar arquivo"

echo "Recursos de teste criados com sucesso!"
echo ""
echo "Endpoints disponíveis:"
echo "- AWS services API: http://localhost:4566"
echo ""
echo "Credenciais AWS para AWS services:"
echo "- Access Key: dummy"
echo "- Secret Key: dummy"
echo "- Região: us-east-1"
