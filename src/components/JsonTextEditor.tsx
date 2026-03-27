import React, { useState, useEffect, useRef } from 'react';

interface JsonTextEditorProps {
  value: any;
  onChange?: (value: any) => void;
  height?: string;
  placeholder?: string;
}

const JsonTextEditor: React.FC<JsonTextEditorProps> = ({
  value,
  onChange,
  height = '400px',
  placeholder = 'Digite JSON válido, ex: {"id": "1", "name": "Item"}'
}) => {
  const [text, setText] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const formatted = JSON.stringify(value, null, 2);
      setText(formatted);
      setIsValid(true);
    } catch (error) {
      setText(String(value));
      setIsValid(false);
    }
  }, [value]);

  useEffect(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.innerHTML = highlightJson(text);
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    try {
      const parsed = JSON.parse(newText);
      setIsValid(true);
      if (onChange) {
        onChange(parsed);
      }
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightJson = (jsonString: string): string => {
    // Função para escapar HTML
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Processar linha por linha
    const lines = jsonString.split('\n');
    const highlightedLines = lines.map(line => {
      // Processar a linha caractere por caractere
      let result = '';
      let inString = false;
      let escapeNext = false;
      let currentToken = '';


      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
          currentToken += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          currentToken += char;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          currentToken += char;
          
          if (!inString) {
            // Fim de string
            const isKey = i + 1 < line.length && line[i + 1] === ':';
            result += `<span class="json-${isKey ? 'key' : 'string'}">${escapeHtml(currentToken)}</span>`;
            currentToken = '';
          }
          continue;
        }
        
        if (inString) {
          currentToken += char;
          continue;
        }
        
        // Fora de strings
        if (char === '{' || char === '}') {
          if (currentToken) {
            result += `<span class="json-text">${escapeHtml(currentToken)}</span>`;
            currentToken = '';
          }
          result += `<span class="json-brace">${char}</span>`;
          continue;
        }
        
        if (char === '[' || char === ']') {
          if (currentToken) {
            result += `<span class="json-text">${escapeHtml(currentToken)}</span>`;
            currentToken = '';
          }
          result += `<span class="json-bracket">${char}</span>`;
          continue;
        }
        
        if (char === ',') {
          if (currentToken) {
            // Verificar tipo do token atual
            const trimmed = currentToken.trim();
            if (trimmed === 'true' || trimmed === 'false') {
              result += `<span class="json-boolean">${escapeHtml(currentToken)}</span>`;
            } else if (trimmed === 'null') {
              result += `<span class="json-null">${escapeHtml(currentToken)}</span>`;
            } else if (/^\d+$/.test(trimmed)) {
              result += `<span class="json-number">${escapeHtml(currentToken)}</span>`;
            } else {
              result += `<span class="json-text">${escapeHtml(currentToken)}</span>`;
            }
            currentToken = '';
          }
          result += `<span class="json-comma">,</span>`;
          continue;
        }
        
        if (char === ':') {
          if (currentToken) {
            result += `<span class="json-text">${escapeHtml(currentToken)}</span>`;
            currentToken = '';
          }
          result += `<span class="json-colon">:</span>`;
          continue;
        }
        
        currentToken += char;
      }
      
      // Adicionar token restante
      if (currentToken) {
        const trimmed = currentToken.trim();
        if (trimmed === 'true' || trimmed === 'false') {
          result += `<span class="json-boolean">${escapeHtml(currentToken)}</span>`;
        } else if (trimmed === 'null') {
          result += `<span class="json-null">${escapeHtml(currentToken)}</span>`;
        } else if (/^\d+$/.test(trimmed)) {
          result += `<span class="json-number">${escapeHtml(currentToken)}</span>`;
        } else {
          result += `<span class="json-text">${escapeHtml(currentToken)}</span>`;
        }
      }
      
      return result || '&nbsp;';
    });
    
    return highlightedLines.join('<br>');
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: height,
      minHeight: '400px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      lineHeight: '1.4'
    }}>
      {/* Área de highlight (atrás) */}
      <div
        ref={highlightRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '8px 12px',
          overflow: 'auto',
          whiteSpace: 'pre',
          color: 'transparent',
          backgroundColor: isValid ? '#f6f8fa' : '#fff2f0',
          border: `1px solid ${isValid ? '#d9d9d9' : '#ff4d4f'}`,
          borderRadius: '4px',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      
      {/* Textarea (na frente) */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          padding: '8px 12px',
          margin: 0,
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.4',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          resize: 'none',
          outline: 'none',
          color: 'transparent',
          caretColor: '#262626',
          zIndex: 2
        }}
        spellCheck="false"
      />
      
      {/* Estilos inline para as cores */}
      <style>{`
        .json-brace, .json-bracket, .json-comma { color: #0050b3; }
        .json-key { color: #722ed1; }
        .json-string { color: #c41d7f; }
        .json-number { color: #389e0d; }
        .json-boolean { color: #d46b08; }
        .json-null { color: #d48806; }
        .json-colon { color: #8c8c8c; }
        .json-text { color: #262626; }
      `}</style>
    </div>
  );
};

export default JsonTextEditor;