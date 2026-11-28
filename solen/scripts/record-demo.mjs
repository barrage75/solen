import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1440;
const HEIGHT = 900;
const DEVICE_SCALE_FACTOR = 2;
const SOURCE_WIDTH = WIDTH * DEVICE_SCALE_FACTOR;
const SOURCE_HEIGHT = HEIGHT * DEVICE_SCALE_FACTOR;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const WORK = path.join(process.env.HOME ?? ROOT, "profil", "solen-video-work");

const readOption = (name, fallback) => {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1] ?? fallback;
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
};

const lang = readOption("--lang", "fr");
const url = new URL(readOption("--url", "http://localhost:3000"));
if (!["fr", "en"].includes(lang)) throw new Error("Usage: node scripts/record-demo.mjs --lang fr|en --url http://localhost:3000");
if (!["http:", "https:"].includes(url.protocol)) throw new Error("--url must use HTTP or HTTPS");

const script = {
  fr: {
    checklist: ["Alerte dès la lecture", "Aucune manipulation", "Tout est expliqué"],
    nuvioInfo: "Un fournisseur change de RIB. Solen alerte **dès la lecture**.",
    nuvioReasons: "L'IBAN ne correspond pas **au profil du fournisseur**.",
    nuvioCallback: "Appeler **le numéro connu**, jamais celui du mail.",
    pdgVerdict: "Un PDG n'écrit pas **depuis Gmail** pour 35\u00a0000\u00a0€.",
    pdgTechniques: "**Tout est expliqué**\u00a0: autorité, secret, contournement de la hiérarchie.",
    daf: "Un vrai mail urgent\u00a0: **aucune fausse alerte**.",
    attacks: "Même avec une IA piégée, **26/26 attaques** bloquées.",
    genuine: "**0 fausse alerte** sur 2 vrais mails.",
    invoice: "Une adresse qui imite le fournisseur\u00a0: **repérée**.",
  },
  en: {
    checklist: ["Alert on reading", "No manipulation", "Everything explained"],
    nuvioInfo: "A supplier changes bank details. Solen alerts **on reading**.",
    nuvioReasons: "The IBAN doesn't match **the supplier profile**.",
    nuvioCallback: "Call **the known number**, never the one in the email.",
    pdgVerdict: "A CEO doesn't email **from Gmail** about €35,000.",
    pdgTechniques: "**Everything explained**: authority, secrecy, bypassing the hierarchy.",
    daf: "A genuine urgent email: **no false alarm**.",
    attacks: "Even with a trapped AI, **26/26 attacks** blocked.",
    genuine: "**0 false alarms** on 2 genuine emails.",
    invoice: "An address imitating the supplier: **caught**.",
  },
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

const escapeConcatPath = (file) => file.replaceAll("\\", "\\\\").replaceAll("'", "'\\''");

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 1 / 30;
};

const fitCaptureClock = (frames) => {
  const samples = frames
    .filter((frame) => Number.isFinite(frame.timestamp) && Number.isFinite(frame.receivedAt))
    .map((frame) => ({ x: frame.receivedAt / 1000, y: frame.timestamp }));
  const meanX = samples.reduce((sum, sample) => sum + sample.x, 0) / samples.length;
  const meanY = samples.reduce((sum, sample) => sum + sample.y, 0) / samples.length;
  const covariance = samples.reduce((sum, sample) => sum + (sample.x - meanX) * (sample.y - meanY), 0);
  const variance = samples.reduce((sum, sample) => sum + (sample.x - meanX) ** 2, 0);
  const rate = variance > 0 ? covariance / variance : 1;
  const offset = meanY - rate * meanX;
  return {
    rate,
    map: (performanceMs) => offset + rate * performanceMs / 1000,
  };
};

const executablePath = process.env.CHROME_PATH
  ? process.env.CHROME_PATH
  : findExecutable(["google-chrome", "chromium", "chromium-browser", "chrome"]);

const smoothCursor = () => {
  const install = () => {
    const root = document.documentElement;
    if (!root) return false;
    if (document.getElementById("solen-demo-cursor")) return true;
    const style = document.createElement("style");
    style.textContent = `
      #solen-demo-cursor{position:fixed;left:-40px;top:-40px;z-index:2147483647;width:28px;height:34px;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
      #solen-demo-cursor.hidden{opacity:0}
      #solen-demo-cursor svg{position:absolute;left:0;top:0;width:22px;height:28px}
      #solen-demo-cursor .pulse{position:absolute;left:3px;top:3px;width:24px;height:24px;border:2px solid rgba(255,207,51,.8);border-radius:50%;opacity:0;transform:scale(.35)}
      #solen-demo-cursor.clicked .pulse{animation:solen-demo-cursor-pulse .58s ease-out}
      @keyframes solen-demo-cursor-pulse{0%{opacity:.9;transform:scale(.35)}100%{opacity:0;transform:scale(1.35)}}
    `;
    root.append(style);
    const cursor = document.createElement("div");
    cursor.id = "solen-demo-cursor";
    cursor.innerHTML = '<span class="pulse"></span><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 1.5v22l5.7-5.3 4.1 9 4-1.8-4.2-8.7 8-.3L2 1.5Z" fill="#0A0F20" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    root.append(cursor);
    document.addEventListener(
      "mousemove",
      (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        cursor.classList.remove("hidden");
      },
      true,
    );
    document.addEventListener(
      "pointerdown",
      () => {
        cursor.classList.remove("clicked");
        void cursor.offsetWidth;
        cursor.classList.add("clicked");
      },
      true,
    );
    return true;
  };

  if (!install()) {
    const observer = new MutationObserver((_, current) => {
      if (install()) current.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  }
};

const statsText = (cards) => cards.map((card) => ({
  value: card.querySelector("span")?.textContent?.trim() ?? "",
  label: [...card.querySelectorAll("span")].slice(1).map((span) => span.textContent?.trim() ?? "").join(" "),
}));

const boxFromSelectors = async (page, selectors) => {
  const boxes = [];
  for (const selector of selectors) {
    const locator = typeof selector === "string" ? page.locator(selector).first() : selector;
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (box && box.width > 0 && box.height > 0) boxes.push(box);
  }
  if (!boxes.length) throw new Error("Could not measure a visible target box");
  const left = Math.max(0, Math.min(...boxes.map((box) => box.x)));
  const top = Math.max(0, Math.min(...boxes.map((box) => box.y)));
  const right = Math.min(WIDTH, Math.max(...boxes.map((box) => box.x + box.width)));
  const bottom = Math.min(HEIGHT, Math.max(...boxes.map((box) => box.y + box.height)));
  if (right <= left || bottom <= top) throw new Error(`Target box is outside the ${WIDTH}x${HEIGHT} recording viewport`);
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const main = async () => {
  await mkdir(WORK, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage", `--force-device-scale-factor=${DEVICE_SCALE_FACTOR}`],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const framesDirectory = path.join(WORK, `demo-solen-${lang}-frames`);
  const frameMetadataPath = path.join(WORK, `demo-solen-${lang}.frames.json`);
  const concatPath = path.join(WORK, `demo-solen-${lang}.ffconcat`);
  await rm(framesDirectory, { recursive: true, force: true });
  await mkdir(framesDirectory, { recursive: true });

  const cdp = await context.newCDPSession(page);
  const frames = [];
  const frameWrites = [];
  const frameAcks = [];
  const captureErrors = [];
  const motionWindows = [];
  let firstTimestamp;
  let captureEndPerformanceMs;
  let resolveFirstFrame;
  let rejectFirstFrame;
  let screencastStarted = false;
  const firstFrame = new Promise((resolve, reject) => {
    resolveFirstFrame = resolve;
    rejectFirstFrame = reject;
  });
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const receivedAt = performance.now();
    const timestamp = metadata?.timestamp;
    if (!Number.isFinite(timestamp)) {
      const error = new Error("Chromium screencast frame did not include metadata.timestamp");
      captureErrors.push(error);
      rejectFirstFrame(error);
    } else if (firstTimestamp === undefined) {
      firstTimestamp = timestamp;
      resolveFirstFrame();
    }

    const filename = `frame-${String(frames.length).padStart(6, "0")}.jpg`;
    frames.push({
      file: filename,
      timestamp,
      receivedAt,
      metadata: {
        deviceWidth: metadata?.deviceWidth,
        deviceHeight: metadata?.deviceHeight,
        offsetTop: metadata?.offsetTop,
        pageScaleFactor: metadata?.pageScaleFactor,
        scrollOffsetX: metadata?.scrollOffsetX,
        scrollOffsetY: metadata?.scrollOffsetY,
      },
    });
    frameWrites.push(
      writeFile(path.join(framesDirectory, filename), Buffer.from(data, "base64")).catch((error) => {
        captureErrors.push(error);
      }),
    );
    frameAcks.push(
      cdp.send("Page.screencastFrameAck", { sessionId }).catch((error) => {
        captureErrors.push(error);
      }),
    );
  });

  await page.addInitScript(smoothCursor);
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: SOURCE_WIDTH,
    maxHeight: SOURCE_HEIGHT,
    everyNthFrame: 1,
  });
  screencastStarted = true;
  await firstFrame;
  const addMotionWindow = (start) => motionWindows.push({ start, end: performance.now() });

  const analysisSources = [];
  const scenes = [];
  let techniqueLabels = [];
  const moveAndClick = async (locator) => {
    await locator.waitFor({ state: "visible", timeout: 20000 });
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error("A required demo control is not visible");
    const x = Math.max(2, Math.min(WIDTH - 2, box.x + box.width / 2));
    const y = Math.max(2, Math.min(HEIGHT - 2, box.y + box.height / 2));
    const motionStart = performance.now();
    await page.mouse.move(x, y, { steps: 18 });
    await page.waitForTimeout(180);
    await page.mouse.click(x, y);
    await page.waitForTimeout(220);
    addMotionWindow(motionStart);
  };

  const requestAnalysis = async (action, mail) => {
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/analyze") && response.request().method() === "POST",
      { timeout: 20000 },
    );
    await action();
    const response = await responsePromise;
    if (!response.ok()) throw new Error(`Analysis for ${mail} returned HTTP ${response.status()}`);
    const result = await response.json();
    if (result.ai === "mistral") throw new Error(`Mistral was unexpectedly used for ${mail}`);
    analysisSources.push({ mail, ai: result.ai, verdict: result.verdict });
    return result;
  };

  const verifyVerdict = async (mail, expected) => {
    const verdict = page.locator(`[data-mail="${mail}"] [data-tour="verdict"]`);
    await verdict.waitFor({ state: "visible", timeout: 20000 });
    const text = await verdict.innerText();
    if (!expected.test(text)) throw new Error(`Unexpected ${mail} verdict: ${text.replaceAll("\n", " · ")}`);
    return text;
  };

  const verifyMailOpened = async (mail, expectedSubject) => {
    const readingPane = page.locator(`article[data-mail="${mail}"]`);
    await readingPane.waitFor({ state: "visible", timeout: 20000 });
    const subject = (await readingPane.locator("h1").innerText()).trim();
    const matches = expectedSubject instanceof RegExp ? expectedSubject.test(subject) : subject === expectedSubject;
    if (!matches) throw new Error(`Expected ${mail} mail, found subject: ${subject}`);
  };

  let trimStartPerformanceMs = 0;
  try {
    const home = new URL("/", url);
    home.searchParams.delete("lang");
    await page.goto(home.href, { waitUntil: "networkidle" });
    await moveAndClick(page.getByRole("button", { name: /Passer la visite|Skip the tour/ }));
    await page.waitForTimeout(250);
    if (lang === "en") {
      await moveAndClick(page.getByRole("button", { name: "Français" }));
      await page.waitForFunction(() => document.documentElement.lang === "fr");
      await moveAndClick(page.getByRole("button", { name: "English" }));
    } else {
      await moveAndClick(page.getByRole("button", { name: "Français" }));
    }
    await page.waitForFunction((expected) => document.documentElement.lang === expected, lang);
    await page.waitForTimeout(700);
    trimStartPerformanceMs = performance.now();

    const nuvioSubject = lang === "fr" ? "Changement de coordonnées bancaires" : "Change of bank details";
    await moveAndClick(page.getByText(nuvioSubject, { exact: true }).first());
    await page.waitForTimeout(900);
    const openPane = page.locator("button").filter({ hasText: /^\s*Solen\s*$/ }).first();
    const nuvioResult = await requestAnalysis(() => moveAndClick(openPane), "nuvio");
    const nuvioExpected = lang === "fr" ? /Fraude/ : /fraud/i;
    await verifyVerdict("nuvio", nuvioExpected);
    await verifyMailOpened("nuvio", nuvioSubject);
    if (nuvioResult.verdict !== "fraude") throw new Error(`Nuvio expected fraude, received ${nuvioResult.verdict}`);

    const addScene = async (id, chapter, activeChecklistIndex, selectors, headline, holdMs = 2300) => {
      const box = await boxFromSelectors(page, selectors);
      const startPerformanceMs = performance.now();
      const motionStart = performance.now();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
      await page.waitForTimeout(140);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(220);
      addMotionWindow(motionStart);
      await page.evaluate(() => document.getElementById("solen-demo-cursor")?.classList.add("hidden"));
      await page.waitForTimeout(holdMs);
      const endPerformanceMs = performance.now();
      scenes.push({
        id,
        chapter,
        activeChecklistIndex,
        headline,
        checklist: script[lang].checklist,
        startPerformanceMs,
        endPerformanceMs,
        box: {
          x: Math.round(box.x * DEVICE_SCALE_FACTOR),
          y: Math.round(box.y * DEVICE_SCALE_FACTOR),
          width: Math.round(box.width * DEVICE_SCALE_FACTOR),
          height: Math.round(box.height * DEVICE_SCALE_FACTOR),
        },
      });
    };

    const nuvioChapter = lang === "fr" ? "01 — FAUX RIB" : "01 — FAKE BANK DETAILS";
    await addScene("nuvio-infobar", nuvioChapter, 0, ['[data-mail="nuvio"] [data-tour="infobar"]'], script[lang].nuvioInfo);
    await addScene(
      "nuvio-verdict-reasons",
      nuvioChapter,
      0,
      [
        '[data-mail="nuvio"] [data-tour="verdict"]',
        '[data-tour="pane"][data-mail="nuvio"] section:has-text("IBAN")',
      ],
      script[lang].nuvioReasons,
    );
    const callback = page.locator('aside[data-mail="nuvio"] [data-tour="callback"]');
    await callback.evaluate((element) => {
      element.parentElement.style.paddingBottom = "480px";
      element.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await addScene(
      "nuvio-callback",
      nuvioChapter,
      0,
      ['aside[data-mail="nuvio"] [data-tour="callback"]'],
      script[lang].nuvioCallback,
    );
    await callback.evaluate((element) => element.parentElement.style.removeProperty("padding-bottom"));

    const pdgSubject = lang === "fr" ? "Virement confidentiel" : "Confidential transfer";
    const pdgResult = await requestAnalysis(() => moveAndClick(page.getByText(pdgSubject, { exact: true }).first()), "pdg");
    await verifyVerdict("pdg", lang === "fr" ? /Fraude/ : /fraud/i);
    await verifyMailOpened("pdg", pdgSubject);
    if (pdgResult.verdict !== "fraude") throw new Error(`PDG expected fraude, received ${pdgResult.verdict}`);
    const pdgPaneText = await page.locator('[data-tour="pane"][data-mail="pdg"]').innerText();
    const pdgReason = pdgPaneText
      .split("\n")
      .map((line) => line.trim())
      .find((line) => (lang === "fr" ? /PDG n'écrit pas depuis Gmail/i : /CEO does not write from Gmail/i).test(line));
    if (!pdgReason) throw new Error(`Could not find the displayed PDG reason: ${pdgPaneText}`);
    await addScene(
      "pdg-mail-verdict",
      lang === "fr" ? "02 — FAUX PRÉSIDENT" : "02 — FAKE CEO",
      2,
      ['[data-mail="pdg"] [data-tour="mail"]', '[data-mail="pdg"] [data-tour="verdict"]'],
      script[lang].pdgVerdict,
    );

    const techniqueSection = page
      .locator('[data-tour="pane"][data-mail="pdg"] section')
      .filter({ hasText: /Techniques de manipulation repérées|Manipulation techniques spotted/ });
    techniqueLabels = (await techniqueSection.locator("span").allTextContents()).map((text) => text.trim()).filter(Boolean);
    const expectedTechniques =
      lang === "fr"
        ? ["autorité", "secret", "contournement de la hiérarchie"]
        : ["authority", "secrecy", "bypassing the hierarchy"];
    if (JSON.stringify(techniqueLabels.map((label) => label.toLocaleLowerCase()).sort()) !== JSON.stringify([...expectedTechniques].sort())) {
      throw new Error(`Unexpected ${lang} PDG technique chips: ${techniqueLabels.join(", ")}`);
    }
    await addScene(
      "pdg-techniques",
      lang === "fr" ? "02 — FAUX PRÉSIDENT" : "02 — FAKE CEO",
      2,
      [techniqueSection],
      script[lang].pdgTechniques,
    );

    const dafSubject = /Urgent.*Lumio Data/i;
    const dafResult = await requestAnalysis(() => moveAndClick(page.getByText(dafSubject).first()), "daf");
    await verifyVerdict("daf", lang === "fr" ? /Aucune anomalie/ : /No anomaly/);
    await verifyMailOpened("daf", dafSubject);
    if (dafResult.verdict !== "fiable") throw new Error(`DAF expected fiable, received ${dafResult.verdict}`);
    await addScene(
      "daf-verdict",
      lang === "fr" ? "03 — VRAI MAIL" : "03 — GENUINE EMAIL",
      null,
      ['[data-mail="daf"] [data-tour="verdict"]'],
      script[lang].daf,
      2400,
    );

    await page.waitForTimeout(700);
    const attacksUrl = new URL("/attaques", url);
    await page.goto(attacksUrl.href, { waitUntil: "networkidle" });
    const replayName = lang === "fr" ? "Rejouer les attaques" : "Replay the attacks";
    const replayButton = page.getByRole("button", { name: replayName });
    await moveAndClick(replayButton);
    const pendingLabel = lang === "fr" ? "En cours" : "Pending";
    await page.waitForFunction(
      ({ pending }) => {
        const list = document.querySelector("ol");
        const cards = [...document.querySelectorAll('section[aria-live="polite"] > div')];
        const value = cards[0]?.querySelector("span")?.textContent?.trim() ?? "";
        const button = [...document.querySelectorAll("button")].find((item) => /Rejouer les attaques|Replay the attacks/.test(item.textContent ?? ""));
        return Boolean(list?.children.length && !list.querySelector(`[aria-label="${pending}"]`) && /^\d+\/\d+$/.test(value) && button && !button.disabled);
      },
      { pending: pendingLabel },
      { timeout: 45000 },
    );
    const attackCards = await page.locator('section[aria-live="polite"] > div').evaluateAll(statsText);
    const totalCases = Number((await page.locator("h1").innerText()).match(/\d+/)?.[0] ?? 28);
    const ratio = attackCards[0]?.value ?? "0/0";
    const falseAlarms = attackCards[1]?.value ?? "0";
    const genuine = Number(attackCards[1]?.label.match(/(?:sur|on)\s+(\d+)/i)?.[1] ?? 2);
    if (totalCases !== 28 || ratio !== "26/26" || falseAlarms !== "0" || genuine !== 2) {
      throw new Error(`Unexpected attack summary: ${totalCases} total; ${ratio} blocked; ${falseAlarms} false alarms on ${genuine} genuine mails`);
    }
    const attackChapter = lang === "fr" ? "04 — AUCUNE MANIPULATION" : "04 — NO MANIPULATION";
    await addScene("attack-summary", attackChapter, 1, ['section[aria-live="polite"]'], script[lang].attacks);

    const scrollMotionStart = performance.now();
    await page.mouse.move(WIDTH * 0.72, HEIGHT * 0.78, { steps: 16 });
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(450);
    addMotionWindow(scrollMotionStart);
    await addScene("attack-list", attackChapter, 1, ["ol > li:nth-child(-n+3)"], script[lang].genuine, 1900);

    await page.waitForTimeout(1700);
    const testerUrl = new URL("/essayer", url);
    await page.goto(testerUrl.href, { waitUntil: "networkidle" });
    const exampleLabel = lang === "fr" ? "Domaine sosie" : "Lookalike domain";
    await moveAndClick(page.getByRole("button", { name: exampleLabel }));
    const analyzeLabel = lang === "fr" ? "Analyser avec Solen" : "Analyze with Solen";
    const testResult = await requestAnalysis(() => moveAndClick(page.getByRole("button", { name: analyzeLabel })), "essayer-domaine-sosie");
    if (testResult.ai === "mistral") throw new Error("The own-mail example unexpectedly called Mistral");
    await page.locator('[data-tour="pane"] [data-tour="verdict"]').waitFor({ state: "visible", timeout: 20000 });
    const testerText = await page.locator("main").innerText();
    const hasRecordedFallback = /analyse enregistrée à l'avance|recorded in advance/i.test(testerText);
    if (!hasRecordedFallback) throw new Error("The lookalike example no longer reports its prerecorded analysis");
    await addScene(
      "try-lookalike-example",
      lang === "fr" ? "05 — FAUSSE FACTURE" : "05 — FAKE INVOICE",
      0,
      ['[data-tour="pane"] [data-tour="verdict"]', '[data-tour="pane"] section:has(mark)'],
      script[lang].invoice,
    );

    captureEndPerformanceMs = performance.now();
    await cdp.send("Page.stopScreencast");
    screencastStarted = false;
    await Promise.all([...frameWrites, ...frameAcks]);
    if (captureErrors.length) throw new AggregateError(captureErrors, "Chromium screencast capture failed");
    await cdp.detach();
    await context.close();

    const orderedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp);
    if (orderedFrames.length < 2) throw new Error(`Expected multiple screencast frames, received ${orderedFrames.length}`);
    const frameDeltas = orderedFrames.slice(1).map((frame, index) => frame.timestamp - orderedFrames[index].timestamp).filter((delta) => delta > 0);
    const medianFrameDuration = median(frameDeltas.slice(-30));
    const captureClock = fitCaptureClock(orderedFrames);
    const trimStartTimestamp = captureClock.map(trimStartPerformanceMs);
    const trimStartSeconds = trimStartTimestamp - firstTimestamp;
    const captureEndTimestamp = Math.max(
      captureClock.map(captureEndPerformanceMs),
      orderedFrames.at(-1).timestamp + medianFrameDuration,
    );
    const finalFrameDuration = Math.max(1 / 120, captureEndTimestamp - orderedFrames.at(-1).timestamp);
    const captureDurationSeconds = captureEndTimestamp - firstTimestamp;
    for (const scene of scenes) {
      scene.rawStart = Number(Math.max(0, captureClock.map(scene.startPerformanceMs) - trimStartTimestamp).toFixed(3));
      scene.rawEnd = Number(Math.max(scene.rawStart, captureClock.map(scene.endPerformanceMs) - trimStartTimestamp).toFixed(3));
      delete scene.startPerformanceMs;
      delete scene.endPerformanceMs;
    }
    const concatLines = ["ffconcat version 1.0"];
    for (let index = 0; index < orderedFrames.length; index += 1) {
      const frame = orderedFrames[index];
      const next = orderedFrames[index + 1];
      const duration = next ? Math.max(1 / 120, next.timestamp - frame.timestamp) : finalFrameDuration;
      concatLines.push(`file '${escapeConcatPath(path.join(framesDirectory, frame.file))}'`);
      concatLines.push(`duration ${duration.toFixed(6)}`);
    }
    concatLines.push(`file '${escapeConcatPath(path.join(framesDirectory, orderedFrames.at(-1).file))}'`);
    await writeFile(concatPath, `${concatLines.join("\n")}\n`);

    const motionFrames = orderedFrames.filter((frame) =>
      motionWindows.some((window) => frame.receivedAt >= window.start && frame.receivedAt <= window.end),
    );
    const motionDurationSeconds = motionWindows.reduce((sum, window) => sum + (window.end - window.start) / 1000, 0);
    const motionFps = motionDurationSeconds > 0 ? motionFrames.length / motionDurationSeconds : 0;
    const overallFps = (orderedFrames.length - 1) / captureDurationSeconds;
    const clockResiduals = orderedFrames
      .map((frame) => Math.abs(captureClock.map(frame.receivedAt) - frame.timestamp) * 1000)
      .sort((a, b) => a - b);
    const frameMetadata = {
      language: lang,
      width: SOURCE_WIDTH,
      height: SOURCE_HEIGHT,
      frameCount: orderedFrames.length,
      captureDurationSeconds: Number(captureDurationSeconds.toFixed(6)),
      captureEndTimestamp,
      frames: orderedFrames.map(({ file, timestamp, metadata }) => ({
        file,
        timestamp,
        relativeTimestamp: Number((timestamp - orderedFrames[0].timestamp).toFixed(6)),
        metadata,
      })),
    };
    await writeFile(frameMetadataPath, `${JSON.stringify(frameMetadata, null, 2)}\n`);

    const timeline = {
      language: lang,
      capture: {
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        screencast: { width: SOURCE_WIDTH, height: SOURCE_HEIGHT, format: "jpeg", quality: 90, everyNthFrame: 1 },
        output: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT },
        averageFps: Number(overallFps.toFixed(2)),
        motionFps: Number(motionFps.toFixed(2)),
        motionFrameCount: motionFrames.length,
        motionDurationSeconds: Number(motionDurationSeconds.toFixed(3)),
        clockMapping: {
          rate: Number(captureClock.rate.toFixed(8)),
          medianAbsoluteResidualMs: Number(median(clockResiduals).toFixed(2)),
          p95AbsoluteResidualMs: Number(clockResiduals[Math.floor(clockResiduals.length * 0.95)].toFixed(2)),
        },
        zoom: false,
      },
      sourceVideo: path.basename(concatPath),
      sourceFrames: path.basename(frameMetadataPath),
      sourceDurationSeconds: Number(captureDurationSeconds.toFixed(6)),
      trimStartSeconds: Number(trimStartSeconds.toFixed(3)),
      analysisSources,
      attackSummary: { totalCases, stopped: ratio, falseAlarms, genuine },
      pdgTechniques: techniqueLabels,
      scenes,
    };
    await writeFile(path.join(WORK, `demo-solen-${lang}.timeline.json`), `${JSON.stringify(timeline, null, 2)}\n`);
    console.log(`Recorded ${lang}: ${orderedFrames.length} screencast frames at ${SOURCE_WIDTH}x${SOURCE_HEIGHT}`);
    console.log(`Screencast cadence: ${overallFps.toFixed(1)} fps overall; ${motionFps.toFixed(1)} fps during motion (${motionFrames.length} frames across ${motionDurationSeconds.toFixed(2)}s)`);
    console.log(`Frame timestamps: ${frameMetadataPath}`);
    console.log(`Timestamped FFmpeg input: ${concatPath}`);
    console.log(`Timeline: ${path.join(WORK, `demo-solen-${lang}.timeline.json`)}`);
    console.log(`Analysis sources: ${analysisSources.map(({ mail, ai, verdict }) => `${mail}=${ai}/${verdict}`).join(", ")}`);
  } catch (error) {
    if (screencastStarted) await cdp.send("Page.stopScreencast").catch(() => {});
    await Promise.allSettled([...frameWrites, ...frameAcks]);
    await cdp.detach().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw error;
  }
  await browser.close();
};

await main();
