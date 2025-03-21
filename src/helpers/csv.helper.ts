import ExcelJS from "exceljs";
import type { Row } from "../interfaces.js";

const readCSV = async (file: string, isACM: boolean = false) => {
  const workbook = new ExcelJS.Workbook();
  const csvFile = await workbook.csv.readFile(file);

  const rows: Row[] = [];
  let headers: string[] = [];

  const headerRow: number = isACM ? 2 : 1;

  csvFile.eachRow((row, rowNumber) => {
    const values = row.values as string[];
    if (rowNumber === headerRow) {
      headers = values.map((value) =>
        typeof value === "string" ? value.trim() : ""
      );
    } else if (rowNumber > headerRow) {
      const rowObject: Row = {};
      headers.forEach((header, i) => {
        rowObject[header] = values[i] ? String(values[i]).trim() : "";
      });
      rows.push(rowObject);
    }
  });

  return rows;
};

const writeCSV = async (filePath: string, data: any) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");

  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map((header) => ({ header, key: header }));

  data.forEach((row: Row) => {
    worksheet.addRow(row);
  });

  await workbook.csv.writeFile(filePath);
};

export { readCSV, writeCSV };