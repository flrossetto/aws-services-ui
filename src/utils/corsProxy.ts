/**
 * Utilitário para lidar com problemas CORS ao acessar emuladores AWS
 */

/**
 * Adiciona headers CORS a uma requisição fetch
 */
export async function fetchWithCORS(url: string, options: RequestInit = {}): Promise<Response> {
  const corsOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Origin': window.location.origin,
      // Headers para evitar problemas CORS
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    },
    mode: 'cors' as RequestMode,
    credentials: 'omit' as RequestCredentials,
  };

  return fetch(url, corsOptions);
}

/**
 * Verifica se um erro é relacionado a CORS
 */
export function isCORSError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  const errorStatus = error.status || error.statusCode;
  
  return (
    errorMessage.includes('CORS') ||
    errorMessage.includes('cross-origin') ||
    errorMessage.includes('Access-Control') ||
    errorStatus === 403 || // Forbidden often indicates CORS issues
    errorStatus === 0 // Network error often indicates CORS
  );
}

/**
 * Tenta fazer uma requisição com fallback para diferentes estratégias CORS
 */
export async function resilientFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const strategies = [
    // Estratégia 1: Fetch normal
    () => fetch(url, options),
    
    // Estratégia 2: Fetch com headers CORS
    () => fetchWithCORS(url, options),
    
    // Estratégia 3: Fetch com mode 'no-cors' (apenas para verificações simples)
    () => fetch(url, { ...options, mode: 'no-cors' as RequestMode }),
  ];

  for (const strategy of strategies) {
    try {
      const response = await strategy();
      
      // Se a resposta for OK ou se for uma verificação simples (no-cors)
      if (response.ok || options.mode === 'no-cors') {
        return response;
      }
      
      // Se for 403, tentar próxima estratégia
      if (response.status === 403) {
        console.warn(`Request falhou com 403, tentando próxima estratégia...`);
        continue;
      }
      
      return response;
    } catch (error) {
      console.warn(`Estratégia falhou:`, error instanceof Error ? error.message : String(error));
      // Continuar para próxima estratégia
    }
  }

  throw new Error('Todas as estratégias de fetch falharam');
}

/**
 * Verifica se o emulador AWS está acessível
 */
export async function checkAWSConnection(): Promise<boolean> {
  try {
    // Tentar várias estratégias para verificar conexão
    const endpoints = [
      'http://localhost:4566/health',
      'http://localhost:4566/',
      'http://localhost:4566',
    ];

    for (const endpoint of endpoints) {
      try {
        await resilientFetch(endpoint, {
          method: 'GET',
          mode: 'no-cors' as RequestMode,
          cache: 'no-cache'
        });
        
        // Se chegou aqui sem erro, a conexão está OK
        return true;
      } catch (error) {
        console.warn(`Endpoint ${endpoint} falhou:`, error instanceof Error ? error.message : String(error));
        // Tentar próximo endpoint
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar conexão AWS:', error instanceof Error ? error.message : String(error));
    return false;
  }
}