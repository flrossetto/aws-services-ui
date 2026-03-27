import React from "react";
import JsonHighlighter from "./JsonHighlighter";
import JsonTextEditor from "./JsonTextEditor";

interface JsonEditorProps {
  value: any;
  onChange?: (value: any) => void;
  readOnly?: boolean;
  height?: string;
  editMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  editMode = false,
  onEditModeChange,
}) => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: "400px",
      }}
    >
      {readOnly ? (
        // Modo somente leitura - usar JsonHighlighter
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: '400px',
            height: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
          }}
        >
          <JsonHighlighter data={value} maxHeight="100%" />
        </div>
      ) : editMode ? (
        // Modo edição - usar editor de texto com syntax highlighting
        <div style={{ flex: 1, minHeight: '400px', height: '100%' }}>
          <JsonTextEditor
            value={value}
            onChange={onChange}
            height="100%"
            placeholder='Digite JSON válido, ex: {"id": "1", "name": "Item"}'
          />
        </div>
      ) : (
        // Modo visual interativo - usar JsonHighlighter (mesmo do DiffViewer)
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: '400px',
            height: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
          }}
        >
          <JsonHighlighter data={value} maxHeight="100%" />
        </div>
      )}
    </div>
  );
};

export default JsonEditor;
