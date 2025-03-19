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

const compareFiles = async (file1: string, file2: string) => {
  const s = spinner();
  s.start("Reading CSV files...");

  const data1 = readCSV(file1, true);
  const data2 = readCSV(file2, false);

  s.stop("CSV Files read correctly!");

  const devices1 = (await data1).map((row: Row) => {
    const deviceName = normalizeModel(row["Device Name"] || "");
    const manufacturer = row.Manufacturer?.toLowerCase()

    // switch (manufacturer) {
    //   case "SHARP":
    //     // Normalización específica para SHARP
    //     deviceName = deviceName.includes(manufacturer)
    //     ? deviceName
    //     : normalizeModel(`${manufacturer.toLowerCase()}${row["Device Name"]}`);
    //     break;
    // }

    const finalName: string = deviceName.includes(manufacturer!)
      ? deviceName
      : normalizeModel(`${manufacturer}${deviceName}`);

    return {
      Device: finalName.toLowerCase().trim()
    };
  });

  const devices2: MissingDevice[] = (await data2).map((row: Row) => {
    let manufacturer = row.Manufacturer?.trim();
    let modelName = row["Model Name"]?.trim();

    switch (manufacturer) {
      case "Redmi":
      case "POCO":
        manufacturer = "Xiaomi";
      // break;
      case "Motorola":
        modelName = modelName?.replace(/\((\d{4})\)/, "- $1").trim();
      case "Nothing":
        modelName = modelName?.replace(/\((\d+)\)/g, " $1").trim();
    }

    const modelLower = modelName?.toLowerCase();
    const manufacturerLower = manufacturer?.toLowerCase();

    const finalName: string = modelLower!.includes(manufacturerLower!)
      ? modelName!
      : `${manufacturer} ${row["Model Name"]}`;

    return {
      Model: finalName,
      Manufacturer: manufacturer,
      Model_Normalized: normalizeModel(finalName),
      Device: row.Device || "",
    };
  });

  const missingDevices = devices2.filter(
    ({ Model_Normalized }) =>
      !devices1.some(({ Device }) => Device === Model_Normalized)
  );

  if (missingDevices.length > 0) {
    await writeCSV(`${filePath}/modified_file1.csv`, devices1);
    await writeCSV(`${filePath}/modified_file2.csv`, devices2);
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
      header: "Manufacturer",
      key: "Manufacturer",
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

  worksheet.autoFilter = 'A1:D1';

  // await workbook.csv.writeFile(savePath);
  await workbook.xlsx.writeFile(savePath);

  log.success(`Missing devices exported to ${savePath}`);

  outro("Process finalized");
};
export { getFiles, readCSV, compareFiles };
