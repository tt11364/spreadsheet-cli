import { cwd } from "node:process";
import path from "node:path";
import fs from "node:fs";

const filePath = path.join(cwd());

const readDirectory = async (dirPath: string) => {
  return fs.promises.readdir(dirPath).catch(async () => {
    throw Error;
  });
};

const getFiles = async () => {
  const files: string[] = await readDirectory(filePath);
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

export { getFiles, readDirectory, filePath };