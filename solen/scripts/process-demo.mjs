import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1920;
const HEIGHT = 1200;
const SOURCE_WIDTH = 2880;
const SOURCE_HEIGHT = 1800;
const TITLE_SECONDS = 2.5;
const END_SECONDS = 3;
const WORK = path.join(process.env.HOME ?? ROOT, "profil", "solen-video-work");
const SIZE_LIMIT_MP4 = 12 * 1024 * 1024;
const SIZE_LIMIT_GIF = 9_000_000;
const CAPTION_TOP = HEIGHT - 48 - 152;
const ZOOM_CENTER_Y = (CAPTION_TOP - 40) / 2;

const readOption = (name, fallback) => {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1] ?? fallback;
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
};

const lang = readOption("--lang", "fr");
if (!["fr", "en"].includes(lang)) throw new Error("Usage: node scripts/process-demo.mjs --lang fr|en");

const strings = {
  fr: {
    title: "Solen bloque l'arnaque par mail à la source.",
    try: "Essayez la démo : solen-demo.vercel.app",
    event: "Hackathon Finaxys « Build What's Next » · octobre 2026",
  },
  en: {
    title: "Solen stops email scams at the source.",
    try: "Try the demo: solen-demo.vercel.app",
    event: "Finaxys “Build What's Next” Hackathon · October 2026",
  },
};

const stem = lang === "fr" ? "demo-solen" : "demo-solen-en";
const rawVideo = path.join(WORK, `demo-solen-${lang}.ffconcat`);
const rawTimeline = path.join(WORK, `demo-solen-${lang}.timeline.json`);
const titleCard = path.join(WORK, `${stem}-title.png`);
const endCard = path.join(WORK, `${stem}-end.png`);
const captionCard = path.join(WORK, `${stem}-caption.png`);
const assPath = path.join(WORK, `${stem}.ass`);
const mainVideo = path.join(WORK, `${stem}-main.mp4`);
const mp4Path = path.join(ROOT, "docs", `${stem}.mp4`);
const gifPath = path.join(ROOT, "docs", `${stem}.gif`);
const timelinePath = path.join(ROOT, "docs", `${stem}.timeline.json`);

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

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))));
  });

const probeDuration = (file) => {
  const value = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    { encoding: "utf8" },
  );
  return Number(value.trim());
};

const escapeHtml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const escapeAss = (text) => text.replaceAll("\\", "\\\\").replaceAll("{", "\\{").replaceAll("}", "\\}");

const assTime = (seconds) => {
  const centiseconds = Math.max(0, Math.round(seconds * 100));
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor((centiseconds % 360000) / 6000);
  const wholeSeconds = Math.floor((centiseconds % 6000) / 100);
  const fraction = centiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(fraction).padStart(2, "0")}`;
};

const makeCardHtml = (lang, logoBase64, content, end = false) => `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8">
    <style>
      *{box-sizing:border-box}
      html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0}
      body{background:#0F3D2E;color:#fff;font-family:"Segoe UI",Arial,sans-serif}
      main{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 150px;background:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.08),transparent 52%),#0F3D2E}
      img{width:188px;height:188px;object-fit:cover;border-radius:30px;box-shadow:0 18px 42px rgba(0,0,0,.24);margin-bottom:${end ? 42 : 58}px}
      h1{max-width:1580px;margin:0;font-size:${end ? 58 : 76}px;font-weight:650;line-height:1.14;letter-spacing:-1.6px;text-wrap:balance}
      .url{color:#ffd43b;font-size:56px;font-weight:650;margin:0 0 24px}
      .event{font-size:33px;color:rgba(255,255,255,.82);margin:0}
      .rule{width:112px;height:4px;border-radius:4px;background:#ffd43b;margin:42px 0}
    </style>
  </head>
  <body>
    <main>
      <img src="data:image/png;base64,${logoBase64}" alt="Solen">
      ${end
        ? `<p class="url">${escapeHtml(content.try)}</p><div class="rule"></div><p class="event">${escapeHtml(content.event)}</p>`
        : `<h1>${escapeHtml(content.title)}</h1>`}
    </main>
  </body>
</html>`;

const renderCards = async () => {
  const logoBase64 = (await readFile(path.join(ROOT, "public", "solen-logo.png"))).toString("base64");
  const chromePath = process.env.CHROME_PATH ?? findExecutable(["google-chrome", "chromium", "chromium-browser", "chrome"]);
  const browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await context.newPage();
    await page.setContent(makeCardHtml(lang, logoBase64, strings[lang]), { waitUntil: "load" });
    await page.screenshot({ path: titleCard });
    await page.setContent(makeCardHtml(lang, logoBase64, strings[lang], true), { waitUntil: "load" });
    await page.screenshot({ path: endCard });
    await page.setContent(
      `<!doctype html><html><head><style>
        *{box-sizing:border-box}html,body{width:${WIDTH}px;height:${HEIGHT}px;margin:0;background:transparent}
        .caption{position:fixed;left:50%;bottom:48px;transform:translateX(-50%);width:88%;height:152px;border:1px solid rgba(255,255,255,.20);border-radius:30px;background:rgba(8,25,20,.86);box-shadow:0 8px 32px rgba(0,0,0,.26)}
      </style></head><body><div class="caption"></div></body></html>`,
      { waitUntil: "load" },
    );
    await page.screenshot({ path: captionCard, omitBackground: true });
    await context.close();
  } finally {
    await browser.close();
  }
};

const zoomFor = (box) => Math.min(1.7, Math.max(1, Math.min(SOURCE_WIDTH / box.width, SOURCE_HEIGHT / box.height)));

const buildSegments = (timeline, mainDuration) => {
  const segments = [];
  let cursor = 0;
  for (const scene of [...timeline.scenes].sort((a, b) => a.rawStart - b.rawStart)) {
    const start = Math.max(cursor, scene.rawStart);
    const end = Math.min(mainDuration, scene.rawEnd);
    if (start > cursor + 0.02) segments.push({ kind: "full", start: cursor, end: start });
    if (end > start + 0.02) segments.push({ kind: "zoom", start, end, scene });
    cursor = Math.max(cursor, end);
  }
  if (mainDuration > cursor + 0.02) segments.push({ kind: "full", start: cursor, end: mainDuration });
  if (!segments.length) throw new Error("The recording timeline contains no usable scenes");
  return segments;
};

const filterGraph = (timeline, segments, mainDuration) => {
  const splitLabels = segments.map((_, index) => `[src${index}]`).join("");
  const graph = [`[0:v]trim=start=${timeline.trimStartSeconds},setpts=PTS-STARTPTS,split=${segments.length}${splitLabels}`];
  segments.forEach((segment, index) => {
    const start = Number(segment.start.toFixed(3));
    const end = Number(segment.end.toFixed(3));
    let chain = `[src${index}]trim=start=${start}:end=${end},setpts=PTS-STARTPTS,fps=30,setsar=1`;
    if (segment.kind === "zoom") {
      const frames = Math.max(4, Math.round((end - start) * 30));
      const transition = Math.min(18, Math.floor(frames / 4));
      const zoom = zoomFor(segment.scene.box);
      const centerX = (segment.scene.box.x + segment.scene.box.width / 2).toFixed(2);
      const centerY = (segment.scene.box.y + segment.scene.box.height / 2).toFixed(2);
      const easingIn = `(0.5-0.5*cos(PI*on/${transition}))`;
      const easingOut = `(0.5-0.5*cos(PI*(on-${frames - transition})/${transition}))`;
      const zoomExpr = `if(lte(on,${transition}),1+(${zoom}-1)*${easingIn},if(lte(on,${frames - transition}),${zoom},${zoom}-(${zoom}-1)*${easingOut}))`;
      const outputScaleY = HEIGHT / SOURCE_HEIGHT;
      const cropY = `min(max(${centerY}-${ZOOM_CENTER_Y}/(${outputScaleY}*zoom),0),ih-ih/zoom)`;
      chain += `,zoompan=z='${zoomExpr}':x='min(max(${centerX}-iw/zoom/2,0),iw-iw/zoom)':y='${cropY}':d=1:s=${WIDTH}x${HEIGHT}:fps=30`;
    } else {
      chain += `,scale=${WIDTH}:${HEIGHT}:flags=lanczos`;
    }
    graph.push(`${chain}[part${index}]`);
  });
  graph.push(`${segments.map((_, index) => `[part${index}]`).join("")}concat=n=${segments.length}:v=1:a=0,setsar=1,format=yuv420p[base]`);

  const overlayInputs = [];
  let previous = "base";
  timeline.scenes.forEach((scene, index) => {
    const start = Math.max(0, scene.rawStart + 0.58);
    const end = Math.max(start + 0.12, Math.min(mainDuration, scene.rawEnd - 0.28));
    const box = `caption${index}`;
    const next = `captioned${index}`;
    overlayInputs.push(["-loop", "1", "-framerate", "30", "-t", mainDuration.toFixed(3), "-i", captionCard]);
    graph.push(`[${index + 1}:v]format=rgba[${box}]`);
    graph.push(`[${previous}][${box}]overlay=0:0:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})':eof_action=pass[${next}]`);
    previous = next;
  });
  const assFile = assPath.replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll("'", "\\'");
  graph.push(`[${previous}]ass=filename='${assFile}'[vout]`);
  return { text: graph.join(";"), overlayInputs };
};

const writeAss = async (timeline) => {
  const lines = [
    "[Script Info]",
    "Title: Solen demo captions",
    "ScriptType: v4.00+",
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding",
    "Style: Default,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,145,145,70,1",
    "",
    "[Events]",
    "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text",
  ];
  for (const scene of timeline.scenes) {
    const start = Math.min(scene.rawEnd, scene.rawStart + 0.12);
    const end = Math.max(start + 0.12, scene.rawEnd - 0.25);
    lines.push(
      `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,{\\fad(180,220)}${escapeAss(scene.caption)}`,
    );
  }
  await writeFile(assPath, `${lines.join("\n")}\n`);
};

const encodeMain = async (timeline, duration) => {
  const segments = buildSegments(timeline, duration);
  const { text, overlayInputs } = filterGraph(timeline, segments, duration);
  const args = ["-y", "-f", "concat", "-safe", "0", "-i", rawVideo];
  for (const input of overlayInputs) args.push(...input);
  args.push(
    "-filter_complex",
    text,
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mainVideo,
  );
  await run("ffmpeg", args);
};

const encodeFinal = async (crf) => {
  const graph = [
    `[0:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=30,setsar=1[title]`,
    `[1:v]fps=30,setsar=1[main]`,
    `[2:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=30,setsar=1[ending]`,
    "[title][main][ending]concat=n=3:v=1:a=0,format=yuv420p[vout]",
  ].join(";");
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-framerate",
    "30",
    "-t",
    String(TITLE_SECONDS),
    "-i",
    titleCard,
    "-i",
    mainVideo,
    "-loop",
    "1",
    "-framerate",
    "30",
    "-t",
    String(END_SECONDS),
    "-i",
    endCard,
    "-filter_complex",
    graph,
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level:v",
    "5.0",
    "-preset",
    "slow",
    "-crf",
    String(crf),
    "-maxrate",
    "1400k",
    "-bufsize",
    "2800k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Path,
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
      `[paletteSource]drawbox=x=0:y=0:w=32:h=32:color=0xFFD43B:t=fill,palettegen=max_colors=${option.colors}:stats_mode=full[palette]`,
      `[frames][palette]paletteuse=dither=${option.dither}:diff_mode=rectangle[vout]`,
    ].join(";");
    await run("ffmpeg", [
      "-y",
      "-i",
      mp4Path,
      "-filter_complex",
      graph,
      "-map",
      "[vout]",
      "-loop",
      "0",
      gifPath,
    ]);
    const size = (await stat(gifPath)).size;
    if (size <= SIZE_LIMIT_GIF) return { ...option, size };
  }
  throw new Error(`GIF exceeds ${SIZE_LIMIT_GIF} bytes after reducing frame rate and width`);
};

const main = async () => {
  await mkdir(WORK, { recursive: true });
  const timeline = JSON.parse(await readFile(rawTimeline, "utf8"));
  const logo = path.join(ROOT, "public", "solen-logo.png");
  if (!existsSync(rawVideo) || !existsSync(logo)) throw new Error(`Missing recording or logo for ${lang}`);
  await renderCards();
  const mainDuration = timeline.sourceDurationSeconds - timeline.trimStartSeconds;
  if (mainDuration <= 0) throw new Error("The trimmed recording has no playable duration");
  await writeAss(timeline);
  await encodeMain(timeline, mainDuration);

  let crf = 24;
  let mp4Size = 0;
  for (const candidate of [24, 26, 28, 30]) {
    await encodeFinal(candidate);
    mp4Size = (await stat(mp4Path)).size;
    crf = candidate;
    if (mp4Size <= SIZE_LIMIT_MP4) break;
  }
  if (mp4Size > SIZE_LIMIT_MP4) throw new Error(`MP4 exceeds ${SIZE_LIMIT_MP4} bytes after increasing compression`);
  const gif = await encodeGif();
  const durationSeconds = probeDuration(mp4Path);
  const finalTimeline = {
    language: timeline.language,
    durationSeconds: Number(durationSeconds.toFixed(3)),
    output: {
      video: path.basename(mp4Path),
      gif: path.basename(gifPath),
      width: WIDTH,
      height: HEIGHT,
      fps: 30,
      codec: "H.264",
      pixelFormat: "yuv420p",
      audio: false,
    },
    capture: timeline.capture,
    analysisSources: timeline.analysisSources,
    attackSummary: timeline.attackSummary,
    scenes: timeline.scenes.map((scene) => ({
      id: scene.id,
      start: Number((TITLE_SECONDS + scene.rawStart).toFixed(3)),
      end: Number((TITLE_SECONDS + scene.rawEnd).toFixed(3)),
      box: {
        x: Math.round(scene.box.x * WIDTH / SOURCE_WIDTH),
        y: Math.round(scene.box.y * HEIGHT / SOURCE_HEIGHT),
        width: Math.round(scene.box.width * WIDTH / SOURCE_WIDTH),
        height: Math.round(scene.box.height * HEIGHT / SOURCE_HEIGHT),
      },
      zoom: Number(zoomFor(scene.box).toFixed(3)),
      caption: scene.caption,
    })),
  };
  await writeFile(timelinePath, `${JSON.stringify(finalTimeline, null, 2)}\n`);
  const mp4Bytes = (await stat(mp4Path)).size;
  console.log(`${mp4Path}: ${(durationSeconds).toFixed(1)}s, ${(mp4Bytes / 1024 / 1024).toFixed(2)} MiB, CRF ${crf}`);
  console.log(`${gifPath}: ${(gif.size / 1024 / 1024).toFixed(2)} MiB, ${gif.width}px wide at ${gif.fps} fps`);
  console.log(`${timelinePath}: ${finalTimeline.scenes.length} scenes`);
};

await main();
