/**
 * Twisty Export - Script d'export batch
 * Copyright (c) 2025 Lekieffre Thomas (DrPepper)
 * Tous droits réservés
 */

import { readFile } from "fs/promises";
import { spawn } from "child_process";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

async function exportOne(row) {
  return new Promise((resolve, reject) => {
    const args = [
      "scripts/exportOne.mjs",
      `--alg=${row.alg}`,
      `--name=${row.name}`,
      `--notation=${row.notation || row.alg}`,
      `--puzzle=${row.puzzle || "3x3x3"}`,
      `--speedFast=${row.speedFast || "2.6"}`,
      `--speedSlow=${row.speedSlow || "0.65"}`,
      `--repeats=${row.repeats || "3"}`,
      `--bg=${row.bg || "#0e0f12"}`,
      `--out=${row.out}`,
    ];

    if (row.bgImage) {
      args.push(`--bgImage=${row.bgImage}`);
    }

    const proc = spawn("node", args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Export échoué pour ${row.name}`));
    });
    proc.on("error", reject);
  });
}

async function main() {
  const csvFile = process.argv[2];

  if (!csvFile) {
    console.error("Usage: npm run batch -- <fichier.csv>");
    process.exit(1);
  }

  console.log("📦 Batch export");
  console.log("Fichier CSV:", csvFile);

  try {
    const text = await readFile(csvFile, "utf8");
    const rows = parseCSV(text);

    console.log(`Nombre d'exports: ${rows.length}`);
    console.log("");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`[${i + 1}/${rows.length}] ${row.name}`);
      await exportOne(row);
      console.log("");
    }

    console.log("✅ Batch terminé");
  } catch (e) {
    console.error("❌ Erreur:", e.message);
    process.exit(1);
  }
}

main();
