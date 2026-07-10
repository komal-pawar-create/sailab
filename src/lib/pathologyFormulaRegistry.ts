import type { PathologyResultRow } from "@/lib/pathologyTypes";

const toNumber = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value: number, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return String(Math.round(value * factor) / factor);
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const findValue = (rows: PathologyResultRow[], names: string[]) => {
  const normalizedNames = names.map(normalize);
  const row = rows.find((r) => normalizedNames.includes(normalize(r.testName)));
  return toNumber(row?.result);
};

export const applyPathologyFormulas = (rows: PathologyResultRow[]): PathologyResultRow[] => {
  const next = rows.map((row) => ({ ...row }));

  const setCalculated = (formulaKey: string, value: number | null, decimals = 2) => {
    if (value === null || !Number.isFinite(value)) return;
    const target = next.find((row) => row.formulaKey === formulaKey);
    if (!target || target.isOverridden) return;
    target.result = round(value, decimals);
    target.isCalculated = true;
  };

  const setCalculatedByName = (names: string[], value: number | null, decimals = 2) => {
    if (value === null || !Number.isFinite(value)) return;
    const normalizedNames = names.map(normalize);
    const target = next.find((row) => normalizedNames.includes(normalize(row.testName)));
    if (!target || target.isOverridden) return;
    target.result = round(value, decimals);
    target.isCalculated = true;
  };

  const triglycerides = findValue(next, ["Triglycerides"]);
  const totalCholesterol = findValue(next, ["Total Cholesterol"]);
  const hdl = findValue(next, ["HDL Cholesterol"]);
  const vldl = triglycerides !== null ? triglycerides / 5 : null;
  setCalculated("lipid.vldl", vldl);
  if (totalCholesterol !== null && hdl !== null && vldl !== null) {
    setCalculated("lipid.ldl", Math.max(0, totalCholesterol - hdl - vldl), 1);
  }
  if (totalCholesterol !== null && hdl !== null && hdl > 0) {
    setCalculated("lipid.total_hdl_ratio", totalCholesterol / hdl, 2);
  }

  const haemoglobin = findValue(next, ["Haemoglobin (Hb)", "Hemoglobin (Hb)"]);
  const rbcCount = findValue(next, ["RBC Count"]);
  const pcv = findValue(next, ["PCV / HCT", "PCV", "HCT"]);
  if (pcv !== null && rbcCount !== null && rbcCount > 0) {
    setCalculatedByName(["MCV"], (pcv / rbcCount) * 10, 1);
  }
  if (haemoglobin !== null && rbcCount !== null && rbcCount > 0) {
    setCalculatedByName(["MCH"], (haemoglobin / rbcCount) * 10, 1);
  }
  if (haemoglobin !== null && pcv !== null && pcv > 0) {
    setCalculatedByName(["MCHC"], (haemoglobin / pcv) * 100, 1);
  }

  const bilirubinTotal = findValue(next, ["Bilirubin Total", "Bilirubin (Total)"]);
  const bilirubinDirect = findValue(next, ["Bilirubin Direct", "Bilirubin (Direct)"]);
  if (bilirubinTotal !== null && bilirubinDirect !== null) {
    setCalculated("lft.indirect_bilirubin", Math.max(0, bilirubinTotal - bilirubinDirect), 2);
  }

  const totalProtein = findValue(next, ["Total Protein", "S. Total Protein"]);
  const albumin = findValue(next, ["Albumin"]);
  if (totalProtein !== null && albumin !== null) {
    const globulin = totalProtein - albumin;
    setCalculated("lft.globulin", Math.max(0, globulin), 1);
    setCalculated("lft.ag_ratio", globulin !== 0 ? albumin / globulin : null);
  }

  const hba1c = findValue(next, ["HbA1c"]);
  if (hba1c !== null) {
    setCalculated("diabetes.eag", 28.7 * hba1c - 46.7, 0);
  }

  const urea = findValue(next, ["S. Urea", "Urea"]);
  if (urea !== null) {
    setCalculated("kft.bun", urea / 2.14, 1);
  }

  return next;
};

export const isValueOutsideRange = (result: string, refRange: string) => {
  const value = toNumber(result);
  if (value === null || !refRange) return false;
  const match = refRange.match(/(-?\d+(\.\d+)?)\s*-\s*(-?\d+(\.\d+)?)/);
  if (!match) return false;
  const min = Number(match[1]);
  const max = Number(match[3]);
  return Number.isFinite(min) && Number.isFinite(max) && (value < min || value > max);
};
