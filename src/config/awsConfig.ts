// Configurações AWS com suporte a localStorage
const getAwsEndpoint = () => {
  if (typeof window !== 'undefined') {
    const savedEndpoint = localStorage.getItem('aws_endpoint');
    if (savedEndpoint) return savedEndpoint;
  }
  return 'http://localhost:4566'; // Valor padrão
};

const getAwsRegion = () => {
  if (typeof window !== 'undefined') {
    const savedRegion = localStorage.getItem('aws_region');
    if (savedRegion) return savedRegion;
  }
  return 'us-east-1'; // Valor padrão
};

const getAwsAccessKeyId = () => {
  if (typeof window !== 'undefined') {
    const savedAccessKeyId = localStorage.getItem('aws_access_key_id');
    if (savedAccessKeyId) return savedAccessKeyId;
  }
  return 'dummy'; // Valor padrão para emuladores
};

const getAwsSecretAccessKey = () => {
  if (typeof window !== 'undefined') {
    const savedSecretAccessKey = localStorage.getItem('aws_secret_access_key');
    if (savedSecretAccessKey) return savedSecretAccessKey;
  }
  return 'dummy'; // Valor padrão para emuladores
};

// Função para verificar se a configuração foi salva
export const hasAwsConfig = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('aws_endpoint');
};

// Função para limpar configuração
export const clearAwsConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('aws_endpoint');
    localStorage.removeItem('aws_region');
    localStorage.removeItem('aws_access_key_id');
    localStorage.removeItem('aws_secret_access_key');
  }
};

export const AWS_CONFIG = {
  region: getAwsRegion(),
  endpoint: getAwsEndpoint(),
  credentials: {
    accessKeyId: getAwsAccessKeyId(),
    secretAccessKey: getAwsSecretAccessKey()
  },
  forcePathStyle: true,
  // Configurações para evitar problemas CORS com LocalStack
  requestHandler: {
    // Adicionar headers CORS manualmente se necessário
  },
  // Desabilitar verificação de certificado SSL para desenvolvimento
  tls: false,
  // Configuração para lidar com erros CORS
  maxAttempts: 3,
  retryMode: 'standard'
};

export const S3_CONFIG = {
  ...AWS_CONFIG,
  endpoint: getAwsEndpoint()
};

export const SQS_CONFIG = {
  ...AWS_CONFIG,
  endpoint: getAwsEndpoint(),
  // Configurações específicas para SQS (protocolo de query)
  apiVersion: '2012-11-05',
  // Forçar uso do endpoint correto para SQS
  useFipsEndpoint: false,
  useDualstackEndpoint: false
};

export const DYNAMODB_CONFIG = {
  ...AWS_CONFIG,
  endpoint: getAwsEndpoint()
};

// Exportar funções para testes
export const getConfig = {
  endpoint: getAwsEndpoint,
  region: getAwsRegion,
  accessKeyId: getAwsAccessKeyId,
  secretAccessKey: getAwsSecretAccessKey
};