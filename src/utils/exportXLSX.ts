import ExcelJS from "exceljs";
import { filePath } from "../helpers/file.helper.js";
import { log, outro } from "@clack/prompts";
import type { MissingDevice } from "../interfaces.js";

const exportXLSX = async (missingDevices: MissingDevice[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Missing Devices");

  worksheet.columns = [
    { header: "Model", key: "Model", width: 40 },
    { header: "Manufacturer", key: "Manufacturer", width: 40 },
    { header: "Device", key: "Device", width: 40 },
    { header: "Normalized Model", key: "Model_Normalized", width: 40 },
  ];

  missingDevices.forEach((device: MissingDevice) => {
    worksheet.addRow(device);
  });

  const savePath = `${filePath}/missing_devices.xlsx`;

  worksheet.autoFilter = "A1:D1";

  await workbook.xlsx.writeFile(savePath);

  log.success(`Missing devices exported to ${savePath}`);
  outro("Process finalized");
};

export { exportXLSX };
