import { intro, select } from '@clack/prompts';
import { compareFiles } from './src/comparison.js';
import { getFiles } from './src/helpers/file.helper.js';

intro('Compare ACM Testing and Google Play CSV files');

const acmTestingCSV = await select({
  message: 'Select the ACM Testing CSV',
  options: await getFiles()
}) as string;

const googlePlayCSV = await select({
  message: 'Select the csv file downloaded from the Google Play Console',
  options: await getFiles()
}) as string

await compareFiles(acmTestingCSV, googlePlayCSV);