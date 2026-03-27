import React from 'react';

interface JsonDiffViewerProps {
  item1: any;
  item2: any;
  item1Key?: string;
  item2Key?: string;
}

const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({ 
  item1, 
  item2, 
  item1Key = 'Item 1', 
  item2Key = 'Item 2' 
}) => {
  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const json1 = formatJson(item1);
  const json2 = formatJson(item2);
  
  const lines1 = json1.split('\n');
  const lines2 = json2.split('\n');
  
  const maxLines = Math.max(lines1.length, lines2.length);
  
  const getLineDiff = (line1: string, line2: string, index: number): { type: 'unchanged' | 'added' | 'removed' | 'modified', line1: string, line2: string } => {
    if (line1 === line2) {
      return { type: 'unchanged', line1, line2 };
    }
    
    if (!line1 && line2) {
      return { type: 'added', line1: '', line2 };
    }
    
    if (line1 && !line2) {
      return { type: 'removed', line1, line2: '' };
    }
    
    // Linhas diferentes
    return { type: 'modified', line1, line2 };
  };

  const renderJsonLine = (line: string, type: 'unchanged' | 'added' | 'removed' | 'modified') => {
    if (!line) return <div style={{ height: '20px' }}></div>;
    
    let bgColor = '#ffffff';
    let borderLeft = 'none';
    
    switch (type) {
      case 'added':
        bgColor = '#e6ffed';
        borderLeft = '4px solid #28a745';
        break;
      case 'removed':
        bgColor = '#ffeef0';
        borderLeft = '4px solid #d73a49';
        break;
      case 'modified':
        bgColor = '#fff5b1';
        borderLeft = '4px solid #ffd33d';
        break;
    }
    
    // Syntax highlighting básico
    const highlightJsonLine = (text: string) => {
      const parts: React.ReactNode[] = [];
      let current = '';
      let inString = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '"' && (i === 0 || text[i-1] !== '\\')) {
          inString = !inString;
          if (current) {
            parts.push(<span key={`text-${i}`}>{current}</span>);
            current = '';
          }
          parts.push(
            <span key={`string-${i}`} style={{ color: '#c41d7f' }}>
              {char}
            </span>
          );
          continue;
        }
        
        if (!inString) {
          if (char === '{' || char === '}' || char === '[' || char === ']') {
            if (current) {
              parts.push(<span key={`text-${i}`}>{current}</span>);
              current = '';
            }
            parts.push(
              <span key={`brace-${i}`} style={{ color: '#0050b3' }}>
                {char}
              </span>
            );
            continue;
          }
          
          if (char === ':') {
            if (current) {
              parts.push(<span key={`text-${i}`}>{current}</span>);
              current = '';
            }
            parts.push(
              <span key={`colon-${i}`} style={{ color: '#8c8c8c' }}>
                {char}
              </span>
            );
            continue;
          }
          
          if (char === ',') {
            if (current) {
              // Verificar tipo
              const trimmed = current.trim();
              if (trimmed === 'true' || trimmed === 'false') {
                parts.push(
                  <span key={`bool-${i}`} style={{ color: '#d46b08' }}>
                    {current}
                  </span>
                );
              } else if (trimmed === 'null') {
                parts.push(
                  <span key={`null-${i}`} style={{ color: '#d48806' }}>
                    {current}
                  </span>
                );
              } else if (/^\d+$/.test(trimmed)) {
                parts.push(
                  <span key={`num-${i}`} style={{ color: '#389e0d' }}>
                    {current}
                  </span>
                );
              } else {
                parts.push(<span key={`text-${i}`}>{current}</span>);
              }
              current = '';
            }
            parts.push(
              <span key={`comma-${i}`} style={{ color: '#0050b3' }}>
                {char}
              </span>
            );
            continue;
          }
        }
        
        current += char;
      }
      
      if (current) {
        const trimmed = current.trim();
        if (!inString) {
          if (trimmed === 'true' || trimmed === 'false') {
            parts.push(
              <span key="bool-end" style={{ color: '#d46b08' }}>
                {current}
              </span>
            );
          } else if (trimmed === 'null') {
            parts.push(
              <span key="null-end" style={{ color: '#d48806' }}>
                {current}
              </span>
            );
          } else if (/^\d+$/.test(trimmed)) {
            parts.push(
              <span key="num-end" style={{ color: '#389e0d' }}>
                {current}
              </span>
            );
          } else {
            parts.push(<span key="text-end">{current}</span>);
          }
        } else {
          parts.push(
            <span key="string-end" style={{ color: '#c41d7f' }}>
              {current}
            </span>
          );
        }
      }
      
      return parts;
    };
    
    return (
      <div style={{
        backgroundColor: bgColor,
        borderLeft,
        padding: '2px 8px',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: '20px'
      }}>
        {highlightJsonLine(line)}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #d9d9d9',
        padding: '8px 16px',
        fontWeight: 'bold'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {item1Key}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {item2Key}
        </div>
      </div>
      
      {/* Conteúdo com scroll */}
      <div style={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'auto',
        minHeight: 0
      }}>
        {/* Coluna 1 */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          borderRight: '1px solid #d9d9d9'
        }}>
          {Array.from({ length: maxLines }).map((_, index) => {
            const line1 = lines1[index] || '';
            const line2 = lines2[index] || '';
            const diff = getLineDiff(line1, line2, index);
            
            return (
              <div key={`left-${index}`} style={{ display: 'flex' }}>
                <div style={{ 
                  width: '40px',
                  backgroundColor: '#fafafa',
                  color: '#8c8c8c',
                  textAlign: 'right',
                  padding: '2px 4px',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  fontSize: '12px',
                  borderRight: '1px solid #f0f0f0'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  {renderJsonLine(line1, diff.type)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Coluna 2 */}
        <div style={{ 
          flex: 1,
          overflow: 'auto'
        }}>
          {Array.from({ length: maxLines }).map((_, index) => {
            const line1 = lines1[index] || '';
            const line2 = lines2[index] || '';
            const diff = getLineDiff(line1, line2, index);
            
            return (
              <div key={`right-${index}`} style={{ display: 'flex' }}>
                <div style={{ 
                  width: '40px',
                  backgroundColor: '#fafafa',
                  color: '#8c8c8c',
                  textAlign: 'right',
                  padding: '2px 4px',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  fontSize: '12px',
                  borderRight: '1px solid #f0f0f0'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  {renderJsonLine(line2, diff.type)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legenda */}
      <div style={{ 
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #d9d9d9',
        padding: '8px 16px',
        fontSize: '12px',
        display: 'flex',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e6ffed', borderLeft: '3px solid #28a745' }}></div>
          <span>Adicionado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ffeef0', borderLeft: '3px solid #d73a49' }}></div>
          <span>Removido</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#fff5b1', borderLeft: '3px solid #ffd33d' }}></div>
          <span>Modificado</span>
        </div>
      </div>
    </div>
  );
};

export default JsonDiffViewer;