import * as XLSX from "xlsx";

/** 从 Excel 缓冲区解析出名称列表：取第一张表的第一列（或第一列有表头则从第二行起） */
export function parseNamesFromExcel(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  const names: string[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const first = row[0];
    const s = first != null ? String(first).trim() : "";
    if (s) names.push(s);
  }
  return names;
}
