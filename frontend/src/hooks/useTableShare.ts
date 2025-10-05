import { useCallback } from 'react';

interface UseTableShareOptions {
  title: string;
  subtitle?: string;
}

export const useTableShare = ({ title, subtitle }: UseTableShareOptions) => {
  // Print the current table
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Open table in a new window for sharing
  const openShareView = useCallback((data: any[], columns: any[], visibleColumns?: any[]) => {
    const shareWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!shareWindow) {
      alert('Please allow popups to open the share view');
      return;
    }

    const columnsToShow = visibleColumns || columns;
    const printColumns = columnsToShow.filter(col => 
      !['comments'].includes(col.key) || (col.width && col.width <= 150)
    );

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            color: #374151;
            background: #f9fafb;
            padding: 20px;
        }
        
        .container {
            max-width: 100%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: #FF661F;
            color: white;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .table-container {
            overflow-x: auto;
            padding: 20px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .table th {
            background: #f3f4f6;
            font-weight: 600;
            text-align: left;
            padding: 12px 8px;
            border-bottom: 2px solid #e5e7eb;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .table td {
            padding: 10px 8px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .table tbody tr:hover {
            background: #f9fafb;
        }
        
        .week-separator {
            background: #fef3c7 !important;
            color: #92400e;
            font-weight: 600;
            text-align: center;
            padding: 12px 8px;
            border-top: 2px solid #f59e0b;
            border-bottom: 2px solid #f59e0b;
        }
        
        /* Special cell styles */
        .status-cell {
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            border-radius: 4px;
            padding: 6px 8px !important;
        }
        
        .font-mono {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }
        
        .text-sm {
            font-size: 11px;
        }
        
        .date-cell {
            font-size: 12px;
            color: #4b5563;
        }
        
        .highlighted-date {
            font-weight: 600;
            color: #ffffff !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            border-radius: 3px;
        }
        
        .actions {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 8px;
            z-index: 1000;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #FF661F;
            color: white;
        }
        
        .btn-primary:hover {
            background: #E55A1A;
        }
        
        .btn-secondary {
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
            background: #f9fafb;
        }
        
        .footer {
            padding: 16px 20px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
        
        @media print {
            .actions {
                display: none !important;
            }
            
            body {
                background: white;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .table {
                font-size: 10px;
            }
            
            .table th,
            .table td {
                padding: 6px 4px;
            }
            
            .status-cell {
                font-size: 9px !important;
                padding: 4px 6px !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .date-cell {
                font-size: 9px;
            }
            
            .highlighted-date {
                font-size: 9px !important;
                font-weight: 600 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .text-sm {
                font-size: 9px;
            }
            
            @page {
                size: A4 landscape;
                margin: 15mm;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 16px;
            }
            
            .table-container {
                padding: 10px;
            }
            
            .actions {
                position: relative;
                top: auto;
                right: auto;
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
        <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
    
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        ${printColumns.map(col => `<th>${col.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((row) => {
                      if (row.isWeekSeparator) {
                        return `<tr><td colspan="${printColumns.length}" class="week-separator">📅 ${row.weekInfo}</td></tr>`;
                      }
                      
                      return `<tr>${printColumns.map(col => {
                        let value = row[col.key] || '-';
                        let cellStyle = '';
                        let cellClass = '';
                        
                        // Handle special column rendering
                        if (col.key === 'status' && row.statusInfo) {
                          value = row.statusInfo.displayName;
                          // Apply status colors
                          cellStyle = `background-color: ${row.statusInfo.backgroundColor}; color: ${row.statusInfo.color}; font-weight: 600; padding: 6px 8px; border-radius: 4px; text-align: center;`;
                          cellClass = 'status-cell';
                        } else if (col.key === 'unit') {
                          cellClass = 'font-mono';
                        } else if (col.key === 'id') {
                          cellClass = 'font-mono text-sm';
                        } else if (['nestingDate', 'machiningDate', 'assemblyDate', 'deliveryDate'].includes(col.key)) {
                          cellClass = 'date-cell';
                          
                          // Format dates using original logic
                          if (value !== null && value !== undefined) {
                            try {
                              const date = new Date(value);
                              if (!isNaN(date.getTime())) {
                                value = date.toLocaleDateString();
                              }
                            } catch {
                              value = value.toString();
                            }
                          } else {
                            value = '-';
                          }
                          
                          // Apply date column highlighting based on status targeting
                          if (row.statusInfo?.targetColumns && Array.isArray(row.statusInfo.targetColumns)) {
                            // Map column keys to the targeting names used in the backend
                            const columnMapping: Record<string, string> = {
                              'nestingDate': 'nesting',
                              'machiningDate': 'machining', 
                              'assemblyDate': 'assembly',
                              'deliveryDate': 'delivery'
                            };
                            
                            const targetColumnName = columnMapping[col.key];
                            if (targetColumnName) {
                              const targetColumn = row.statusInfo.targetColumns.find(
                                (target: any) => target && target.column && target.column.toLowerCase() === targetColumnName.toLowerCase()
                              );
                              
                              if (targetColumn && targetColumn.color) {
                                // Ensure color has # prefix
                                const color = targetColumn.color.startsWith('#') ? targetColumn.color : `#${targetColumn.color}`;
                                cellStyle = `background-color: ${color}; color: #ffffff; font-weight: 600; padding: 8px;`;
                                cellClass = 'date-cell highlighted-date';
                              }
                            }
                          }
                        }
                        
                        const styleAttr = cellStyle ? ` style="${cellStyle}"` : '';
                        const classAttr = cellClass ? ` class="${cellClass}"` : '';
                        
                        return `<td${styleAttr}${classAttr}>${value}</td>`;
                      }).join('')}</tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            J11 Production Manager - ${data.filter(item => !item.isWeekSeparator).length} jobs
        </div>
    </div>
</body>
</html>`;

    shareWindow.document.write(html);
    shareWindow.document.close();
    shareWindow.focus();
  }, [title, subtitle]);

  // Generate shareable URL (for future email integration)
  const generateShareableLink = useCallback((filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  }, []);

  return {
    handlePrint,
    openShareView,
    generateShareableLink
  };
};