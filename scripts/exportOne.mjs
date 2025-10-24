import { chromium } from "playwright";
import { spawn } from "child_process";
import { mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

function parseArgs() {
  // Parser robuste pour PowerShell/Windows: agrège les tokens
  // qui appartiennent à la même option jusqu'au prochain "--"
  const args = {};
  const tokens = process.argv.slice(2);
  let currentKey = null;
  let acc = [];
  const positional = [];
  const flush = () => {
    if (!currentKey) return;
    const value = acc.join(" ").trim();
    args[currentKey] = value === "" ? true : value;
    currentKey = null;
    acc = [];
  };
  for (const tok of tokens) {
    if (tok.startsWith("--")) {
      flush();
      const eq = tok.indexOf("=");
      if (eq >= 0) {
        currentKey = tok.slice(2, eq);
        acc = [tok.slice(eq + 1)];
      } else {
        currentKey = tok.slice(2);
        acc = [];
      }
    } else {
      if (currentKey) acc.push(tok);
      else positional.push(tok);
    }
  }
  flush();
  if (positional.length) {
    args._positional = positional.join(" ").trim();
  }
  return args;
}

function getOpt(args, key, def) {
  const envKey = `npm_config_${key}`;
  const fromArgs = args[key];
  const fromEnv = process.env[envKey];
  let val = fromArgs !== undefined ? fromArgs : fromEnv;
  if (val === undefined || val === true || String(val).trim() === "") {
    return def;
  }
  return String(val);
}

async function execCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Commande échouée avec le code ${code}`));
    });
    proc.on("error", reject);
  });
}

// Exécute une commande et capture stderr (utile pour analyser la sortie ffmpeg)
async function execCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => resolve({ code, stderr }));
    proc.on("error", reject);
  });
}

// Détecte la durée de noir au tout début avec ffmpeg blackdetect
async function detectLeadingBlack(videoPath) {
  const args = [
    "-hide_banner",
    "-i",
    videoPath,
    "-vf",
    "blackdetect=d=0.05:pic_th=0.98",
    "-an",
    "-f",
    "null",
    "-",
  ];
  const { stderr } = await execCapture("ffmpeg", args);
  const lines = stderr.split(/\r?\n/);
  let leading = 0;
  for (const line of lines) {
    if (line.includes("black_start:0")) {
      const m = line.match(/black_end:([0-9.]+)/);
      if (m) {
        leading = Math.min(3, Math.max(0, parseFloat(m[1])));
        break;
      }
    }
  }
  // Ne pas couper si la détection dépasse 1.0s (trop agressive)
  if (leading > 1.0) return 0;
  return leading;
}

async function main() {
  const args = parseArgs();
  const headless = !(
    args.show || String(args.headless).toLowerCase() === "false"
  );

  let alg = getOpt(args, "alg", "R U R' U'");
  // fallback: alg passé en positionnel (ex: npm run export -- R U R' U' ...)
  if (args._positional && (!args.alg || alg.split(/\s+/).length < 5)) {
    alg = args._positional;
  }
  const name = getOpt(args, "name", "");
  const notation = getOpt(args, "notation", alg);
  const puzzle = getOpt(args, "puzzle", "3x3x3");
  const speedFast = getOpt(args, "speedFast", "2.6");
  const speedSlow = getOpt(args, "speedSlow", "0.65");
  const repeats = getOpt(args, "repeats", "3");
  const bg = getOpt(args, "bg", "#0e0f12");
  const bgImage = getOpt(args, "bgImage", "");
  let bgVideo = getOpt(args, "bgVideo", "");
  if (!bgVideo && existsSync("public/fond.mp4")) {
    bgVideo = "public/fond.mp4";
  }
  const out = getOpt(args, "out", "out/export.mp4");
  const trimStartOpt = getOpt(args, "trimStart", "auto");
  let trimStartSec = 0;
  const tailPadMs = parseInt(getOpt(args, "tailPad", "3000"), 10);

  console.log("🎬 Export vidéo Twisty");
  console.log("Algo:", alg);
  console.log("Nom:", name);
  console.log("Sortie:", out);

  // Créer le dossier de sortie
  const outDir = path.dirname(out);
  if (!existsSync(outDir)) {
    await mkdir(outDir, { recursive: true });
  }

  const tmpDir = path.join(outDir, "tmp");
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true });
  }

  // Construire l'URL
  const params = new URLSearchParams({
    alg,
    name,
    notation,
    puzzle,
    speedFast,
    speedSlow,
    repeats,
    bg,
  });
  if (bgImage) params.set("bgImage", bgImage);
  if (bgVideo) params.set("bgVideo", bgVideo);

  const url = `http://127.0.0.1:5173/export.html?${params}`;
  console.log("URL:", url);

  let browser;
  let context;
  let page;
  let videoPath;

  try {
    // Lancer Chromium
    console.log("🚀 Lancement de Chromium...");
    const chromeArgs = [
      // Forcer ANGLE D3D11 ou EGL selon plateformes (Windows aime D3D11)
      "--use-angle=swiftshader",
      "--use-gl=egl",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-features=VaapiVideoDecoder",
      // Aider le pipeline GPU
      "--enable-zero-copy",
      "--enable-gpu-rasterization",
      // Eviter l'occlusion qui peut geler les animations
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-features=CalculateNativeWinOcclusion",
    ];
    if (headless) chromeArgs.unshift("--headless=new");
    browser = await chromium.launch({ headless, args: chromeArgs });

    context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      recordVideo: {
        dir: tmpDir,
        size: { width: 1080, height: 1920 },
      },
    });

    page = await context.newPage();
    page.on("console", (msg) => {
      try {
        console.log(`[PAGE:${msg.type()}]`, msg.text());
      } catch {}
    });
    page.on("pageerror", (err) => {
      console.error("[PAGEERR]", err?.message || err);
    });

    // Aller sur la page
    console.log("📄 Chargement de la page...");
    await page.goto(url, { waitUntil: "networkidle" });

    // Attendre que la page soit prête
    console.log("⏳ Attente que la page et le cube soient prêts...");
    await page.waitForFunction(() => window.__exportReady === true, {
      timeout: 30000,
    });
    console.log("✓ Cube initialisé");

    // Démarrer l'export et l'enregistrement
    console.log("🎥 Démarrage de l'enregistrement...");

    // Attendre la fin de l'export
    console.log("⏳ Enregistrement en cours...");
    await page.evaluate(async () => {
      await window.startExport();
    });

    // Attendre encore un peu pour finaliser l'enregistrement
    await new Promise((r) => setTimeout(r, tailPadMs));
    console.log("✓ Enregistrement terminé");

    // Fermer pour finaliser la vidéo
    const video = page.video();
    await page.close();
    videoPath = await video.path();
    await context.close();
    await browser.close();

    console.log("📹 Vidéo WebM enregistrée:", videoPath);

    // Détection automatique du noir initial
    if (trimStartOpt === "auto") {
      try {
        const detected = await detectLeadingBlack(videoPath);
        trimStartSec = detected;
        console.log(`🕒 Trim auto détecté: ${trimStartSec.toFixed(2)}s`);
      } catch (e) {
        console.warn("⚠️  Échec détection du noir initial:", e.message);
        trimStartSec = 0;
      }
    } else {
      trimStartSec = Math.max(0, parseFloat(trimStartOpt));
    }

    // Transcoder avec ffmpeg
    console.log("🎞️  Transcodage avec ffmpeg...");
    const ffArgs = ["-i", videoPath];
    if (trimStartSec > 0) ffArgs.push("-ss", trimStartSec.toString());
    ffArgs.push(
      "-vf",
      "fps=30,format=yuv420p,scale=1080:1920:flags=lanczos",
      "-c:v",
      "libx264",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-y",
      out
    );
    await execCommand("ffmpeg", ffArgs);

    console.log("✓ Transcodage terminé");

    // Nettoyer
    await unlink(videoPath);
    console.log("🧹 Fichiers temporaires supprimés");

    console.log("✅ Export réussi:", out);
  } catch (e) {
    console.error("❌ Erreur:", e.message);
    process.exit(1);
  }
}

main();
