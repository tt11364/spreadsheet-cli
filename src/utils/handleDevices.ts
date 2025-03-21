import { normalizeModel } from "./normalize.js";
import type { Row, MissingDevice } from "../interfaces.js";

const processDevices1 = (data: Row[]): { Device: string }[] => {
  return data.map((row: Row) => {
    const deviceName = normalizeModel(row["Device Name"] || "");
    const manufacturer = row.Manufacturer?.toLowerCase();

    const finalName: string = deviceName.includes(manufacturer!)
      ? deviceName
      : normalizeModel(`${manufacturer}${deviceName}`);

    return {
      Device: finalName.toLowerCase().trim(),
    };
  });
};

const processDevices2 = (data: Row[]): MissingDevice[] => {
  return data.map((row: Row) => {
    let manufacturer = row.Manufacturer?.trim();
    let modelName = row["Model Name"]?.trim();

    switch (manufacturer) {
      case "Redmi":
      case "POCO":
        manufacturer = "Xiaomi";
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
};

export { processDevices1, processDevices2 };
