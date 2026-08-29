import ExcelJS from 'exceljs';

/**
 * Creates a workbook with sheets from JSON data and triggers download
 * This replaces the vulnerable xlsx package with the more secure exceljs
 */
export async function createExcelWorkbook(
  sheets: Array<{
    name: string;
    data: Record<string, any>[];
    columns?: { header: string; key: string; width?: number }[];
  }>,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clinic System';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    
    if (sheet.columns) {
      worksheet.columns = sheet.columns;
    } else if (sheet.data.length > 0) {
      // Auto-generate columns from first row keys
      const keys = Object.keys(sheet.data[0]);
      worksheet.columns = keys.map(key => ({
        header: key,
        key: key,
        width: Math.max(key.length + 2, 15)
      }));
    }

    // Add rows
    sheet.data.forEach(row => {
      worksheet.addRow(row);
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Creates a workbook with sheets from array-of-arrays data
 */
export async function createExcelFromArrays(
  sheets: Array<{
    name: string;
    data: any[][];
    columnWidths?: number[];
  }>,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clinic System';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    
    // Add all rows from the array
    sheet.data.forEach((row, rowIndex) => {
      const excelRow = worksheet.addRow(row);
      
      // Style header row (first row)
      if (rowIndex === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
    });

    // Set column widths if provided
    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((width, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = width;
      });
    } else {
      // Auto-width based on content
      worksheet.columns.forEach(column => {
        column.width = 18;
      });
    }
  }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
