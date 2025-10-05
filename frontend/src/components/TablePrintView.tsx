import type { TableColumn } from './DataTable';

interface TablePrintViewProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  title: string;
  subtitle?: string;
  visibleColumns?: TableColumn<T>[];
}

function TablePrintView<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  visibleColumns
}: TablePrintViewProps<T>) {
  const columnsToShow = visibleColumns || columns;
  
  // Filter out very wide columns for print
  const printColumns = columnsToShow.filter(col => 
    !['comments'].includes(col.key) || (col.width && col.width <= 150)
  );

  return (
    <div className="print-container">
      {/* Print Styles */}
      <style>{`
        @media print {
          .print-container {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            background: white;
          }
          
          .print-header {
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
          }
          
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
          }
          
          .print-table td {
            font-size: 9px;
          }
          
          .week-separator {
            background-color: #e0e0e0 !important;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
          }
          
          .print-footer {
            position: fixed;
            bottom: 10px;
            right: 10px;
            font-size: 8px;
            color: #666;
          }
          
          /* A4 Portrait optimizations */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          /* A3 Landscape for more columns */
          @media (min-width: 1000px) {
            @page {
              size: A3 landscape;
              margin: 10mm;
            }
          }
        }
        
        @media screen {
          .print-container {
            padding: 20px;
            max-width: 100%;
            background: white;
            min-height: 100vh;
          }
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
            {subtitle}
          </p>
        )}
        <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#666' }}>
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Table */}
      <table className="print-table">
        <thead>
          <tr>
            {printColumns.map((column) => (
              <th key={column.key} style={{ width: column.width ? `${column.width}px` : 'auto' }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            // Check if this is a week separator row
            if ((row as any).isWeekSeparator) {
              return (
                <tr key={`separator-${index}`}>
                  <td colSpan={printColumns.length} className="week-separator">
                    📅 {(row as any).weekInfo}
                  </td>
                </tr>
              );
            }
            
            return (
              <tr key={index}>
                {printColumns.map((column) => (
                  <td key={`${index}-${column.key}`}>
                    {column.render 
                      ? typeof column.render(row[column.key], row) === 'string'
                        ? column.render(row[column.key], row)
                        : row[column.key] || '-'
                      : row[column.key] || '-'
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="print-footer">
        J11 Production Manager - {data.filter(item => !(item as any).isWeekSeparator).length} jobs
      </div>
    </div>
  );
}

export default TablePrintView;