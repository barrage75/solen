import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(ROOT, "..");
const WORK = path.join(process.env.HOME ?? ROOT, "profil", "solen-video-work");
const BRAND = path.join(ROOT, "scripts", "demo-assets");
const WIDTH = 1920;
const HEIGHT = 1080;
const SOURCE_WIDTH = 2880;
const SOURCE_HEIGHT = 1800;
const APP_WIDTH = 1200;
const APP_HEIGHT = 750;
const APP_X = 648;
const APP_Y = 165;
const TITLE_SECONDS = 2.5;
const END_SECONDS = 3;
const SIZE_LIMIT_MP4 = 12 * 1024 * 1024;
const SIZE_LIMIT_GIF = 9_000_000;
const MAX_INITIAL_GAP = 2;
const MAX_INTER_SCENE_GAP = 1.7;
const MAX_TRAILING_GAP = 0.2;
const COLORS = { navy: "#0A0F20", yellow: "#FFCF33", cream: "#F2F1E9", line: "#293146" };

const readOption = (name, fallback) => {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1] ?? fallback;
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
};

const lang = readOption("--lang", "fr");
if (!["fr", "en"].includes(lang)) throw new Error("Usage: node scripts/process-demo.mjs --lang fr|en");

const stem = lang === "fr" ? "demo-solen" : "demo-solen-en";
const rawVideo = path.join(WORK, `demo-solen-${lang}.ffconcat`);
const rawTimeline = path.join(WORK, `demo-solen-${lang}.timeline.json`);
const titleCard = path.join(WORK, `${stem}-title.png`);
const endCard = path.join(WORK, `${stem}-end.png`);
const baseCard = path.join(WORK, `${stem}-base.png`);
const frameCard = path.join(WORK, `${stem}-window-frame.png`);
const maskCard = path.join(WORK, `${stem}-window-mask.png`);
const mainVideo = path.join(WORK, `${stem}-main.mp4`);
const mp4Path = path.join(ROOT, "docs", `${stem}.mp4`);
const gifPath = path.join(ROOT, "docs", `${stem}.gif`);
const timelinePath = path.join(ROOT, "docs", `${stem}.timeline.json`);
const content = {
  fr: {
    try: "ESSAYEZ-LA",
    footer: "Hackathon Finaxys · Build What's Next",
  },
  en: {
    try: "TRY IT",
    footer: "Finaxys Hackathon · Build What's Next",
  },
};

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))));
  });

const probeDuration = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], {
      encoding: "utf8",
    }).trim(),
  );

const escapeHtml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const headlineHtml = (text) => {
  let output = "";
  let accented = false;
  for (const part of text.split("**")) {
    output += accented ? `<span class="accent">${escapeHtml(part)}</span>` : escapeHtml(part);
    accented = !accented;
  }
  return output;
};

const findExecutable = (names) => {
  for (const name of names) {
    if (path.isAbsolute(name) && existsSync(name)) return name;
    for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
      const candidate = path.join(directory, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
};

const runFfmpeg = (args) => run("ffmpeg", args);

const makeFontCss = async () => {
  const read = async (filename) => (await readFile(path.join(BRAND, "fonts", filename))).toString("base64");
  const [archivoLatin, archivoExt, manropeLatin, manropeExt, monoLatin, monoExt] = await Promise.all([
    read("archivo-latin.woff2"),
    read("archivo-latin-ext.woff2"),
    read("manrope-latin.woff2"),
    read("manrope-latin-ext.woff2"),
    read("jetbrains-mono-latin.woff2"),
    read("jetbrains-mono-latin-ext.woff2"),
  ]);
  return `
    @font-face{font-family:Archivo;font-style:normal;font-weight:800;font-stretch:125%;src:url(data:font/woff2;base64,${archivoLatin}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:Archivo;font-style:normal;font-weight:800;font-stretch:125%;src:url(data:font/woff2;base64,${archivoExt}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
    @font-face{font-family:Manrope;font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${manropeLatin}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:Manrope;font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${manropeExt}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
    @font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${monoLatin}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${monoExt}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
  `;
};

const makeArcs = (stroke, opacity, position = "bottom") => {
  const cx = 1925;
  const cy = position === "top" ? -20 : 1090;
  return `<svg class="arcs" viewBox="0 0 1920 1080" aria-hidden="true"><g fill="none" stroke="${stroke}" stroke-width="2" opacity="${opacity}">${[90, 150, 210, 270, 330, 390].map((radius) => `<circle cx="${cx}" cy="${cy}" r="${radius}"/>`).join("")}</g></svg>`;
};

const makeIntroHtml = (logo) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden}
  body{background:${COLORS.navy};color:${COLORS.cream};font-family:Manrope,sans-serif}
  .arcs{position:absolute;inset:0;width:100%;height:100%}
  main{position:relative;width:100%;height:100%;padding:170px 96px}
  .logo{display:block;width:950px;height:240px;object-fit:contain;object-position:left center}
  h1{position:absolute;left:96px;top:500px;width:1280px;margin:0;font:800 72px/1.12 Archivo,sans-serif;font-stretch:125%;letter-spacing:-1.5px;text-wrap:balance}
  .highlight{display:inline;background:${COLORS.yellow};color:${COLORS.navy};padding:0 12px 4px}
</style></head><body>${makeArcs(COLORS.yellow,".24")}<main><img class="logo" src="${logo}"><h1>We stop email scams <span class="highlight">at the source.</span></h1></main></body></html>`;

const makeEndHtml = (logo, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden}
  body{background:${COLORS.yellow};color:${COLORS.navy};font-family:Manrope,sans-serif}
  .arcs{position:absolute;inset:0;width:100%;height:100%}
  .label{position:absolute;left:96px;top:122px;font:400 24px/1 "JetBrains Mono",monospace;letter-spacing:.04em}
  .url{position:absolute;left:92px;top:270px;margin:0;white-space:nowrap;font:800 108px/1 Archivo,sans-serif;font-stretch:125%;letter-spacing:-2px}
  .logo{position:absolute;left:94px;bottom:86px;width:220px;height:96px;object-fit:contain;object-position:left center}
  .footer{position:absolute;left:410px;bottom:119px;font:400 18px/1.4 "JetBrains Mono",monospace}
</style></head><body>${makeArcs(COLORS.navy,".20","top")}<p class="label">${content[lang].try}</p><h1 class="url">solen-demo.vercel.app</h1><img class="logo" src="${logo}"><p class="footer">${escapeHtml(content[lang].footer)}</p></body></html>`;

const makeBaseHtml = () => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden;background:${COLORS.navy}}
  .arcs{position:absolute;inset:0;width:100%;height:100%}
  .shadow{position:absolute;left:${APP_X}px;top:${APP_Y}px;width:${APP_WIDTH}px;height:${APP_HEIGHT}px;border-radius:18px;box-shadow:0 24px 72px rgba(0,0,0,.46)}
</style></head><body>${makeArcs(COLORS.yellow,".26")}<div class="shadow"></div></body></html>`;

const makeWindowFrameHtml = () => `<!doctype html><html><head><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden;background:transparent}
  .frame{position:absolute;left:${APP_X}px;top:${APP_Y}px;width:${APP_WIDTH}px;height:${APP_HEIGHT}px;border:1px solid rgba(242,241,233,.40);border-radius:18px}
</style></head><body><div class="frame"></div></body></html>`;

const makeChapterHtml = (chapter, checklist, active) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden;background:transparent}
  .label{position:absolute;left:96px;top:116px;width:480px;color:${COLORS.yellow};font:400 20px/1.3 "JetBrains Mono",monospace;letter-spacing:.04em;text-transform:uppercase}
  .checklist{position:absolute;left:96px;top:786px;width:480px}
  .item{height:64px;border-top:1px solid rgba(242,241,233,.22);display:flex;align-items:center;gap:14px;color:${COLORS.cream};font:600 21px/1.2 Manrope,sans-serif}
  .item:last-child{border-bottom:1px solid rgba(242,241,233,.22)}
  .item.inactive{opacity:.35}.tick{color:${COLORS.yellow};font:400 21px/1 "JetBrains Mono",monospace}
</style></head><body><div class="label">${escapeHtml(chapter)}</div><div class="checklist">${checklist.map((item, index) => `<div class="item ${active === index ? "" : "inactive"}"><span class="tick">✓</span><span>${escapeHtml(item)}</span></div>`).join("")}</div></body></html>`;

const makeHeadlineHtml = (headline) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;overflow:hidden;background:transparent}
  h1{position:absolute;left:96px;top:202px;width:680px;max-height:420px;margin:0;color:${COLORS.cream};font:800 60px/1.04 Archivo,sans-serif;font-stretch:125%;letter-spacing:-.7px;text-wrap:balance;transform:scaleX(.8);transform-origin:left top}
  .accent{color:${COLORS.yellow}}
</style></head><body><h1>${headlineHtml(headline)}</h1></body></html>`;

const renderAssets = async (timeline) => {
  const fontCss = await makeFontCss();
  const logo1 = `data:image/png;base64,${(await readFile(path.join(BRAND, "logo-page1.png"))).toString("base64")}`;
  const logo4 = `data:image/png;base64,${(await readFile(path.join(BRAND, "logo-page4.png"))).toString("base64")}`;
  const chromePath = process.env.CHROME_PATH ?? findExecutable(["google-chrome", "chromium", "chromium-browser", "chrome"]);
  const browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const setPage = async (html, target, transparent = false, fitHeadline = false) => {
      await page.setViewportSize({ width: WIDTH, height: HEIGHT });
      await page.setContent(html.replace("</head>", `<style>${fontCss}</style></head>`), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      if (fitHeadline) {
        const result = await page.evaluate(() => {
          const heading = document.querySelector("h1");
          if (!heading) return { ok: false, lines: 0, size: 0 };
          let lastLines = 0;
          for (let size = 60; size >= 54; size -= 2) {
            heading.style.fontSize = `${size}px`;
            const styles = getComputedStyle(heading);
            const lineHeight = styles.lineHeight.endsWith("px") ? parseFloat(styles.lineHeight) : parseFloat(styles.lineHeight) * parseFloat(styles.fontSize);
            const lines = Math.round(heading.getBoundingClientRect().height / lineHeight);
            lastLines = lines;
            if (lines <= 4) return { ok: true, lines, size };
          }
          return { ok: false, lines: lastLines, size: 54 };
        });
        if (!result.ok) throw new Error(`Headline exceeds four lines (${result.lines} at ${result.size}px): ${target}`);
      }
      await page.screenshot({ path: target, omitBackground: transparent });
    };
    if (lang === "fr") {
      const titleScript = "import pymupdf,sys; d=pymupdf.open(sys.argv[1]); d[0].get_pixmap(matrix=pymupdf.Matrix(4/3,4/3),alpha=False).save(sys.argv[2])";
      execFileSync("python3", ["-c", titleScript, path.resolve(REPO_ROOT, "diapo", "Solen-diapo-hackathon.pdf"), titleCard]);
    } else {
      await setPage(makeIntroHtml(logo1), titleCard);
    }
    await setPage(makeEndHtml(logo4, lang), endCard);
    await setPage(makeBaseHtml(), baseCard);
    await setPage(makeWindowFrameHtml(), frameCard, true);
    await page.setViewportSize({ width: APP_WIDTH, height: APP_HEIGHT });
    await page.setContent(`<html><body style="margin:0;background:transparent"><svg width="${APP_WIDTH}" height="${APP_HEIGHT}"><rect x="0.5" y="0.5" width="${APP_WIDTH-1}" height="${APP_HEIGHT-1}" rx="18" fill="white"/></svg></body></html>`);
    await page.screenshot({ path: maskCard, omitBackground: true });

    const chapters = new Map();
    for (const scene of timeline.scenes) {
      const existing = chapters.get(scene.chapter);
      if (existing) existing.end = scene.outputEnd;
      else chapters.set(scene.chapter, {
        chapter: scene.chapter,
        checklist: scene.checklist,
        active: scene.activeChecklistIndex,
        start: scene.outputStart,
        end: scene.outputEnd,
      });
    }
    const chapterImages = [];
    for (const chapter of chapters.values()) {
      const filename = path.join(WORK, `${stem}-chapter-${chapterImages.length}.png`);
      await setPage(makeChapterHtml(chapter.chapter, chapter.checklist, chapter.active), filename, true);
      chapterImages.push({ ...chapter, file: filename });
    }
    const headlineImages = [];
    for (const scene of timeline.scenes) {
      const filename = path.join(WORK, `${stem}-headline-${scene.id}.png`);
      await setPage(makeHeadlineHtml(scene.headline), filename, true, true);
      scene._headlineImage = filename;
      headlineImages.push(scene);
    }
    return { chapterImages, headlineImages };
  } finally {
    await browser.close();
  }
};

const zoomFor = (box) => Math.min(1.7, Math.max(1, Math.min(SOURCE_WIDTH / box.width, SOURCE_HEIGHT / box.height)));

const buildSegments = (timeline, duration) => {
  const segments = [];
  let sourceCursor = 0;
  let outputCursor = 0;
  for (const scene of [...timeline.scenes].sort((a, b) => a.rawStart - b.rawStart)) {
    const gap = Math.max(0, scene.rawStart - sourceCursor);
    const keptGap = Math.min(gap, sourceCursor === 0 ? MAX_INITIAL_GAP : MAX_INTER_SCENE_GAP);
    if (keptGap > 0.02) {
      segments.push({
        kind: "full",
        sourceStart: scene.rawStart - keptGap,
        sourceEnd: scene.rawStart,
        outputStart: outputCursor,
        outputEnd: outputCursor + keptGap,
      });
      outputCursor += keptGap;
    }
    const sourceStart = Math.max(scene.rawStart, sourceCursor);
    const sourceEnd = Math.min(scene.rawEnd, duration);
    if (sourceEnd > sourceStart + 0.02) {
      scene.outputStart = outputCursor;
      scene.outputEnd = outputCursor + sourceEnd - sourceStart;
      segments.push({ kind: "zoom", sourceStart, sourceEnd, outputStart: outputCursor, outputEnd: scene.outputEnd, scene });
      outputCursor = scene.outputEnd;
    }
    sourceCursor = Math.max(sourceCursor, scene.rawEnd);
  }
  const trailingGap = Math.max(0, duration - sourceCursor);
  const keptTail = Math.min(trailingGap, MAX_TRAILING_GAP);
  if (keptTail > 0.02) {
    segments.push({
      kind: "full",
      sourceStart: duration - keptTail,
      sourceEnd: duration,
      outputStart: outputCursor,
      outputEnd: outputCursor + keptTail,
    });
    outputCursor += keptTail;
  }
  return { segments, outputDuration: outputCursor };
};

const makeMainGraph = (timeline, segments, chapterImages, headlineImages) => {
  const labels = segments.map((_, index) => `[src${index}]`).join("");
  const graph = [`[0:v]trim=start=${timeline.trimStartSeconds},setpts=PTS-STARTPTS,split=${segments.length}${labels}`];
  segments.forEach((segment, index) => {
    const start = segment.sourceStart.toFixed(3);
    const end = segment.sourceEnd.toFixed(3);
    let chain = `[src${index}]trim=start=${start}:end=${end},setpts=PTS-STARTPTS,fps=30,setsar=1`;
    if (segment.kind === "zoom") {
      const frames = Math.max(4, Math.round((segment.sourceEnd - segment.sourceStart) * 30));
      const transition = Math.min(18, Math.floor(frames / 4));
      const zoom = zoomFor(segment.scene.box);
      const cx = segment.scene.box.x + segment.scene.box.width / 2;
      const cy = segment.scene.box.y + segment.scene.box.height / 2;
      const easingIn = `(0.5-0.5*cos(PI*on/${transition}))`;
      const easingOut = `(0.5-0.5*cos(PI*(on-${frames - transition})/${transition}))`;
      const z = `if(lte(on,${transition}),1+(${zoom}-1)*${easingIn},if(lte(on,${frames - transition}),${zoom},${zoom}-(${zoom}-1)*${easingOut}))`;
      const x = `min(max(${cx}-iw/zoom/2,0),iw-iw/zoom)`;
      const y = `min(max(${cy}-ih/zoom/2,0),ih-ih/zoom)`;
      chain += `,zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${APP_WIDTH}x${APP_HEIGHT}:fps=30`;
    } else {
      chain += `,scale=${APP_WIDTH}:${APP_HEIGHT}:flags=lanczos`;
    }
    graph.push(`${chain}[part${index}]`);
  });
  graph.push(`${segments.map((_, index) => `[part${index}]`).join("")}concat=n=${segments.length}:v=1:a=0,format=yuv420p[window]`);
  graph.push("[2:v]format=gray[mask]");
  graph.push(`[window]format=rgba[windowRgba]`);
  graph.push(`[windowRgba][mask]alphamerge[masked]`);
  graph.push(`[1:v][masked]overlay=${APP_X}:${APP_Y}:shortest=1[app]`);
  graph.push("[app][3:v]overlay=0:0:shortest=1[framed]");
  let current = "framed";
  let imageInput = 4;
  for (const [index, chapter] of chapterImages.entries()) {
    const start = chapter.start.toFixed(3);
    const fadeOut = Math.max(chapter.start, chapter.end - 0.25).toFixed(3);
    graph.push(`[${imageInput + index}:v]format=rgba,fade=t=in:st=${start}:d=0.25:alpha=1,fade=t=out:st=${fadeOut}:d=0.25:alpha=1[chapter${index}]`);
    graph.push(`[${current}][chapter${index}]overlay=0:0:shortest=1[withChapter${index}]`);
    current = `withChapter${index}`;
  }
  imageInput += chapterImages.length;
  const sorted = [...headlineImages].sort((a, b) => a.outputStart - b.outputStart);
  for (const [index, scene] of sorted.entries()) {
    const start = scene.outputStart + 0.65;
    const next = sorted[index + 1];
    const sameChapter = next?.chapter === scene.chapter;
    const end = sameChapter ? next.outputStart + 0.9 : Math.max(start + 0.25, scene.outputEnd - 0.15);
    const fadeOut = Math.max(start, end - 0.25);
    const inputIndex = imageInput + index;
    graph.push(`[${inputIndex}:v]format=rgba,fade=t=in:st=${start.toFixed(3)}:d=0.25:alpha=1,fade=t=out:st=${fadeOut.toFixed(3)}:d=0.25:alpha=1[headline${index}]`);
    graph.push(`[${current}][headline${index}]overlay=0:0:shortest=1[withHeadline${index}]`);
    current = `withHeadline${index}`;
    scene.headlineStart = Number(start.toFixed(3));
    scene.headlineEnd = Number(end.toFixed(3));
  }
  graph.push(`[${current}]fps=30,format=yuv420p[vout]`);
  return graph.join(";");
};

const encodeMain = async (timeline, segments, outputDuration, assets) => {
  if (!segments.length) throw new Error("The recording timeline contains no scenes");
  const graph = makeMainGraph(timeline, segments, assets.chapterImages, assets.headlineImages);
  const args = ["-y", "-filter_complex_threads", "1", "-f", "concat", "-safe", "0", "-i", rawVideo];
  const files = [baseCard, maskCard, frameCard, ...assets.chapterImages.map((entry) => entry.file), ...assets.headlineImages.map((scene) => scene._headlineImage)];
  for (const file of files) args.push("-loop", "1", "-framerate", "30", "-t", outputDuration.toFixed(3), "-i", file);
  args.push("-filter_complex", graph, "-map", "[vout]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", mainVideo);
  await runFfmpeg(args);
};

const encodeFinal = async (crf) => {
  const graph = [
    `[0:v]fps=30,fade=t=out:st=${TITLE_SECONDS - 0.35}:d=0.35,setsar=1[title]`,
    "[1:v]fps=30,setsar=1[main]",
    "[2:v]fps=30,setsar=1[end]",
    "[title][main][end]concat=n=3:v=1:a=0,format=yuv420p[vout]",
  ].join(";");
  await runFfmpeg([
    "-y",
    "-loop", "1", "-framerate", "30", "-t", String(TITLE_SECONDS), "-i", titleCard,
    "-i", mainVideo,
    "-loop", "1", "-framerate", "30", "-t", String(END_SECONDS), "-i", endCard,
    "-filter_complex", graph, "-map", "[vout]", "-an", "-c:v", "libx264", "-profile:v", "high", "-level:v", "5.0",
    "-preset", "slow", "-crf", String(crf), "-maxrate", "1800k", "-bufsize", "3600k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4Path,
  ]);
};

const encodeGif = async () => {
  const options = [
    { fps: 10, width: 800, colors: 128, dither: "bayer" },
    { fps: 8, width: 800, colors: 128, dither: "bayer" },
    { fps: 8, width: 720, colors: 64, dither: "none" },
    { fps: 8, width: 720, colors: 48, dither: "none" },
    { fps: 8, width: 720, colors: 32, dither: "none" },
  ];
  for (const option of options) {
    const graph = [
      `[0:v]fps=${option.fps},scale=${option.width}:-1:flags=lanczos,split[frames][paletteSource]`,
      `[paletteSource]palettegen=max_colors=${option.colors}:stats_mode=full[palette]`,
      `[frames][palette]paletteuse=dither=${option.dither}:diff_mode=rectangle[vout]`,
    ].join(";");
    await runFfmpeg(["-y", "-i", mp4Path, "-filter_complex", graph, "-map", "[vout]", "-loop", "0", gifPath]);
    const size = (await stat(gifPath)).size;
    if (size <= SIZE_LIMIT_GIF) return { ...option, size };
  }
  throw new Error("GIF exceeds 9 MB after reducing frame rate and width");
};

const main = async () => {
  await mkdir(WORK, { recursive: true });
  const timeline = JSON.parse(await readFile(rawTimeline, "utf8"));
  if (!existsSync(rawVideo)) throw new Error(`Missing recording ${rawVideo}`);
  const duration = timeline.sourceDurationSeconds - timeline.trimStartSeconds;
  if (duration <= 0) throw new Error("The trimmed recording has no playable duration");
  const segmentTimeline = buildSegments(timeline, duration);
  if (segmentTimeline.outputDuration <= 0) throw new Error("The timeline contains no playable scenes");
  const assets = await renderAssets(timeline);
  await encodeMain(timeline, segmentTimeline.segments, segmentTimeline.outputDuration, assets);

  let mp4Size = 0;
  let crf = 24;
  for (const candidate of [24, 26, 28, 30]) {
    await encodeFinal(candidate);
    mp4Size = (await stat(mp4Path)).size;
    crf = candidate;
    if (mp4Size <= SIZE_LIMIT_MP4) break;
  }
  if (mp4Size > SIZE_LIMIT_MP4) throw new Error(`MP4 exceeds ${SIZE_LIMIT_MP4} bytes`);
  const gif = await encodeGif();
  const finalDuration = probeDuration(mp4Path);
  const finalTimeline = {
    language: lang,
    durationSeconds: Number(finalDuration.toFixed(3)),
    output: { video: path.basename(mp4Path), gif: path.basename(gifPath), width: WIDTH, height: HEIGHT, fps: 30, codec: "H.264", pixelFormat: "yuv420p", audio: false },
    brand: { navy: COLORS.navy, yellow: COLORS.yellow, cream: COLORS.cream, display: "Archivo 800 / 125% width", body: "Manrope 400", labels: "JetBrains Mono 400" },
    capture: timeline.capture,
    analysisSources: timeline.analysisSources,
    attackSummary: timeline.attackSummary,
    pdgTechniques: timeline.pdgTechniques,
    editing: {
      sourceSeconds: Number(duration.toFixed(3)),
      renderedAppSeconds: Number(segmentTimeline.outputDuration.toFixed(3)),
      maxInitialGapSeconds: MAX_INITIAL_GAP,
      maxInterSceneGapSeconds: MAX_INTER_SCENE_GAP,
    },
    gif: { width: gif.width, fps: gif.fps, colors: gif.colors, sizeBytes: gif.size },
    scenes: timeline.scenes.map((scene) => ({
      id: scene.id, chapter: scene.chapter, activeChecklistIndex: scene.activeChecklistIndex, headline: scene.headline,
      start: Number((TITLE_SECONDS + scene.headlineStart).toFixed(3)), end: Number((TITLE_SECONDS + scene.headlineEnd).toFixed(3)),
      appStart: Number((TITLE_SECONDS + scene.outputStart).toFixed(3)),
      appEnd: Number((TITLE_SECONDS + scene.outputEnd).toFixed(3)),
      sourceStart: scene.rawStart, sourceEnd: scene.rawEnd,
      box: { x: scene.box.x, y: scene.box.y, width: scene.box.width, height: scene.box.height },
      zoom: Number(zoomFor(scene.box).toFixed(3)),
    })),
  };
  await writeFile(timelinePath, `${JSON.stringify(finalTimeline, null, 2)}\n`);
  console.log(`${mp4Path}: ${finalDuration.toFixed(1)}s, ${mp4Size} bytes, CRF ${crf}`);
  console.log(`${gifPath}: ${gif.size} bytes, ${gif.width}px wide at ${gif.fps} fps`);
  console.log(`Brand: ${COLORS.navy} / ${COLORS.yellow} / ${COLORS.cream}; Archivo, Manrope, JetBrains Mono`);
  console.log(`PDG techniques: ${(timeline.pdgTechniques ?? []).join(" · ")}`);
};

await main();
