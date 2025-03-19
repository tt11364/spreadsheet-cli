import { cwd } from "node:process";
import path from "node:path";
import fs from "node:fs";
import ExcelJS from "exceljs";
import { log, outro, spinner } from "@clack/prompts";
import type { Row, MissingDevice } from "./interfaces.ts";

const filePath = path.join(cwd());

const getFiles = async () => {
  const files: string[] = await readDirectory(filePath); // Works
  const csvFiles = files
    .filter((file: string) => file.endsWith("csv"))
    .map((file) => ({
      value: path.join(filePath, file),
      label: file,
    }));

  if (csvFiles.length === 0) {
    throw new Error("No files available");
  }

  return csvFiles;
};

const readDirectory = async (dirPath: string) => {
  return fs.promises.readdir(dirPath).catch(async () => {
    throw Error;
  });
};

const normalizeModel = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, "");
};

const readCSV = async (file: string, isACM: boolean = false) => {
  const workbook = new ExcelJS.Workbook();
  const csvFile = await workbook.csv.readFile(file);

  const rows: Row[] = [];

  let headers: string[] = [];

  // Check header
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

const compareFiles = async (file1: string, file2: string) => {
  const s = spinner();
  s.start("Reading CSV files...");

  const data1 = readCSV(file1, true);
  const data2 = readCSV(file2, false);

  s.stop("CSV Files read correctly!");

  const devices1 = (await data1).map((row: Row) => {
    const deviceName = normalizeModel(row["Device Name"] || "");
    return {
      Device: deviceName.trim().toLowerCase(),
    };
  });

  const devices2: MissingDevice[] = (await data2).map((row: Row) => {
    let manufacturer = row.Manufacturer?.trim() || "";
    const modelName = row["Model Name"] || "";

    // if (manufacturer === "xiaomi") {
    //   manufacturer = "";
    // }

    if (manufacturer === "poco" || manufacturer === "redmi") {
      manufacturer = "xiaomi";
    }

    const finalName: string = modelName.includes(manufacturer)
      ? modelName
      : `${manufacturer} ${row["Model Name"]}`;

    return {
      Model: finalName,
      Model_Normalized: normalizeModel(finalName),
      Device: row.Device || ''
    };
  });

  const missingDevices = devices2.filter(
    ({ Model_Normalized }) => !devices1.some(({ Device }) => Device === Model_Normalized)
  );

  if (missingDevices.length > 0) {
    exportXLSX(missingDevices);
  } else {
    log.success("All devices in the second CSV are present in the first.");
  }
};

const exportXLSX = async (missingDevices: MissingDevice[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Missing Devices");

  worksheet.columns = [
    {
      header: "Model",
      key: "Model",
      width: 40,
    },
    {
      header: "Device",
      key: "Device",
      width: 40,
    },
    {
      header: "Normalized Model",
      key: "Model_Normalized",
      width: 40,
    },
  ];

  missingDevices.forEach((device: MissingDevice) => {
    worksheet.addRow(device);
  });

  const savePath = `${filePath}/missing_devices.xlsx`;

  await workbook.xlsx.writeFile(savePath);

  log.success(`Missing devices exported to ${savePath}`);

  outro('Process finalized')
};
export { getFiles, readCSV, compareFiles };
