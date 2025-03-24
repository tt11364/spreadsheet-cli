import { log, spinner } from "@clack/prompts";
import { readCSV, writeCSV } from "./helpers/index.js";
import { filePath } from "./helpers/file.helper.js";
import { processDevices1, processDevices2, exportXLSX } from "./utils/index.js";

const compareFiles = async (file1: string, file2: string) => {
  const s = spinner();
  s.start("Reading CSV files...");

  const data1 = await readCSV(file1, true);
  const data2 = await readCSV(file2, false);

  s.stop("CSV Files read correctly!");

  const devices1 = processDevices1(data1);
  const devices2 = processDevices2(data2);

  const missingDevices = devices2.filter(
    ({ Model_Normalized }) =>
      !devices1.some(({ Device }) => Device === Model_Normalized)
  );

  if (missingDevices.length > 0) {
    log.step(`Google Play Console: ${devices2.length}`);
    log.step(`Devices not in ACM Testing file: ${missingDevices.length}`);
    await writeCSV(`${filePath}/acm.csv`, devices1);
    await writeCSV(`${filePath}/googleplay.csv`, devices2);
    await exportXLSX(missingDevices);
  } else {
    log.success("All devices in the second CSV are present in the first.");
  }
};

export { compareFiles };
