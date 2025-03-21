import { normalizeModel } from "./normalize.js";
import type { Row, MissingDevice } from "../interfaces.js";

const handleModelName = (modelName: string, manufacturer: string) => {
  switch (manufacturer) {
    case "Redmi":
    case "POCO":
      manufacturer = "Xiaomi";
      break
    case "Motorola":
      console.log(modelName);
      modelName = modelName?.replace(/\s-\s(\d{4})/, " ($1)").trim();
      console.log(modelName);
      break;
    case "Nothing":
      modelName = modelName?.replace(/\((\d+)\)/g, " $1").trim();
      break;
  }

  return {
    proccesedModel: modelName.toLowerCase().trim(),
    processedManufacturer: manufacturer.toLowerCase().trim(),
  };
};

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
    const manufacturer = row.Manufacturer!.trim();
    const modelName = row["Model Name"]!.trim();

    const { proccesedModel, processedManufacturer } = handleModelName(
      modelName,
      manufacturer
    );

    const finalName: string = proccesedModel.includes(processedManufacturer)
      ? proccesedModel
      : `${processedManufacturer} ${proccesedModel}`;

    return {
      Model: finalName,
      Manufacturer: processedManufacturer,
      Model_Normalized: normalizeModel(finalName),
      Device: row.Device || "",
    };
  });
};

export { processDevices1, processDevices2 };
