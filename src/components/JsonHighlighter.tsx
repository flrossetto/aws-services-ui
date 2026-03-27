import React from 'react';

interface JsonHighlighterProps {
  data: any;
  maxHeight?: string;
}

const JsonHighlighter: React.FC<JsonHighlighterProps> = ({ data, maxHeight = '400px' }) => {
  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const highlightJson = (jsonString: string): React.ReactNode[] => {
    const lines = jsonString.split('\n');
    return lines.map((line, index) => {
      const parts: Array<{ text: string; type: 'brace' | 'bracket' | 'key' | 'string' | 'number' | 'boolean' | 'null' | 'comma' | 'colon' | 'text' }> = [];
      
      let currentText = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
          currentText += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          currentText += char;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          currentText += char;
          continue;
        }
        
        if (!inString) {
          // Fora de strings, processar símbolos especiais
          if (char === '{' || char === '}') {
            if (currentText) {
              parts.push({ text: currentText, type: 'text' });
              currentText = '';
            }
            parts.push({ text: char, type: 'brace' });
            continue;
          }
          
          if (char === '[' || char === ']') {
            if (currentText) {
              parts.push({ text: currentText, type: 'text' });
              currentText = '';
            }
            parts.push({ text: char, type: 'bracket' });
            continue;
          }
          
          if (char === ',') {
            if (currentText) {
              // Verificar tipo do texto atual
              const trimmed = currentText.trim();
              if (trimmed === 'true' || trimmed === 'false') {
                parts.push({ text: currentText, type: 'boolean' });
              } else if (trimmed === 'null') {
                parts.push({ text: currentText, type: 'null' });
              } else if (/^\d+$/.test(trimmed)) {
                parts.push({ text: currentText, type: 'number' });
              } else {
                parts.push({ text: currentText, type: 'text' });
              }
              currentText = '';
            }
            parts.push({ text: char, type: 'comma' });
            continue;
          }
          
          if (char === ':') {
            if (currentText) {
              // Verificar se é uma chave (termina com ")
              if (currentText.trim().endsWith('"')) {
                parts.push({ text: currentText, type: 'key' });
              } else {
                parts.push({ text: currentText, type: 'text' });
              }
              currentText = '';
            }
            parts.push({ text: char, type: 'colon' });
            continue;
          }
        }
        
        currentText += char;
      }
      
      // Adicionar texto restante
      if (currentText) {
        // Verificar tipo do texto restante
        const trimmed = currentText.trim();
        if (!inString) {
          if (trimmed === 'true' || trimmed === 'false') {
            parts.push({ text: currentText, type: 'boolean' });
          } else if (trimmed === 'null') {
            parts.push({ text: currentText, type: 'null' });
          } else if (/^\d+$/.test(trimmed)) {
            parts.push({ text: currentText, type: 'number' });
          } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            parts.push({ text: currentText, type: 'string' });
          } else {
            parts.push({ text: currentText, type: 'text' });
          }
        } else {
          parts.push({ text: currentText, type: 'string' });
        }
      }
      
      // Renderizar as partes com cores
      return (
        <div key={index} style={{ 
          fontFamily: 'Consolas, "Courier New", monospace', 
          fontSize: '13px',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {parts.map((part, partIndex) => {
            let color = '#262626'; // Cor padrão (texto escuro)
            
            switch (part.type) {
              case 'brace':
              case 'bracket':
              case 'comma':
                color = '#0050b3'; // Azul escuro para símbolos (bom contraste)
                break;
              case 'key':
                color = '#722ed1'; // Roxo para chaves
                break;
              case 'string':
                color = '#c41d7f'; // Rosa/magenta para strings (bom contraste)
                break;
              case 'number':
                color = '#389e0d'; // Verde escuro para números
                break;
              case 'boolean':
                color = '#d46b08'; // Laranja para booleanos
                break;
              case 'null':
                color = '#d48806'; // Amarelo/laranja para null
                break;
              case 'colon':
                color = '#8c8c8c'; // Cinza médio para dois pontos
                break;
            }
            
            return (
              <span key={partIndex} style={{ color }}>
                {part.text}
              </span>
            );
          })}
        </div>
      );
    });
  };

    try {
      const jsonString = formatJson(data);
      return (
        <div style={{ 
          background: '#ffffff', 
          color: '#262626',
          padding: '16px', 
          borderRadius: '6px',
          height: '100%',
          maxHeight: maxHeight,
          overflow: 'auto',
          fontFamily: 'Consolas, "Courier New", monospace',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {highlightJson(jsonString)}
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div style={{ 
          background: '#fff2f0', 
          padding: '16px', 
          borderRadius: '6px',
          height: '100%',
          maxHeight: maxHeight,
          overflow: 'auto',
          color: '#ff4d4f',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <pre style={{ margin: 0 }}>Erro ao formatar JSON: {String(error)}</pre>
          </div>
        </div>
      );
    }
};

export default JsonHighlighter;