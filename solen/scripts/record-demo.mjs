import { existsSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1440;
const HEIGHT = 900;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1200;
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

const captions = {
  fr: {
    nuvio: "Un fournisseur annonce un nouveau RIB.",
    reasons: "Solen compare l'IBAN au profil du fournisseur : il ne correspond pas.",
    callback: "Solen conseille d'appeler le numéro déjà connu, jamais celui du mail.",
    daf: "Un vrai mail urgent ne déclenche pas d'alerte.",
    attacks: (total, ratio, falseAlarms, genuine) =>
      `${total} cas rejoués avec une IA piégée : ${ratio} attaques bloquées, ${falseAlarms} fausse alerte sur ${genuine} vrais mails.`,
    example: "Testez votre propre mail : Solen l'analyse en direct.",
    exampleFallback: "Exemple « Domaine sosie » : Solen repère l'adresse qui imite le fournisseur.",
  },
  en: {
    nuvio: "A supplier announces new bank details.",
    reasons: "Solen compares the IBAN with the supplier's profile: it doesn't match.",
    callback: "Solen recommends calling the number already on file, never the one in the email.",
    daf: "A genuinely urgent email doesn't trigger an alert.",
    attacks: (total, ratio, falseAlarms, genuine) =>
      `${total} cases replayed with a fooled AI: ${ratio} attacks blocked, ${falseAlarms} false alarms across ${genuine} genuine emails.`,
    example: "Try your own email: Solen analyzes it live.",
    exampleFallback: "Lookalike-domain example: Solen flags the address imitating a supplier.",
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
      #solen-demo-cursor svg{position:absolute;left:0;top:0;width:22px;height:28px}
      #solen-demo-cursor .pulse{position:absolute;left:3px;top:3px;width:24px;height:24px;border:2px solid rgba(15,61,46,.55);border-radius:50%;opacity:0;transform:scale(.35)}
      #solen-demo-cursor.clicked .pulse{animation:solen-demo-cursor-pulse .58s ease-out}
      @keyframes solen-demo-cursor-pulse{0%{opacity:.9;transform:scale(.35)}100%{opacity:0;transform:scale(1.35)}}
    `;
    root.append(style);
    const cursor = document.createElement("div");
    cursor.id = "solen-demo-cursor";
    cursor.innerHTML = '<span class="pulse"></span><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 1.5v22l5.7-5.3 4.1 9 4-1.8-4.2-8.7 8-.3L2 1.5Z" fill="#10251e" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    root.append(cursor);
    document.addEventListener(
      "mousemove",
      (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
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
    const locator = page.locator(selector).first();
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (box && box.width > 0 && box.height > 0) boxes.push(box);
  }
  if (!boxes.length) throw new Error(`Could not measure a visible box for ${selectors.join(", ")}`);
  const left = Math.max(0, Math.min(...boxes.map((box) => box.x)));
  const top = Math.max(0, Math.min(...boxes.map((box) => box.y)));
  const right = Math.min(WIDTH, Math.max(...boxes.map((box) => box.x + box.width)));
  const bottom = Math.min(HEIGHT, Math.max(...boxes.map((box) => box.y + box.height)));
  if (right <= left || bottom <= top) throw new Error(`Target box is outside the ${WIDTH}x${HEIGHT} recording viewport`);
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const main = async () => {
  await mkdir(WORK, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: WORK, size: { width: WIDTH, height: HEIGHT } },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const video = page.video();
  const recordingOrigin = performance.now();
  const elapsed = () => (performance.now() - recordingOrigin) / 1000;
  await page.addInitScript(smoothCursor);

  const analysisSources = [];
  const scenes = [];
  const moveAndClick = async (locator) => {
    await locator.waitFor({ state: "visible", timeout: 20000 });
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error("A required demo control is not visible");
    const x = Math.max(2, Math.min(WIDTH - 2, box.x + box.width / 2));
    const y = Math.max(2, Math.min(HEIGHT - 2, box.y + box.height / 2));
    await page.mouse.move(x, y, { steps: 18 });
    await page.waitForTimeout(180);
    await page.mouse.click(x, y);
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

  let trimStartSeconds = 0;
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
    trimStartSeconds = elapsed();

    const nuvioSubject = lang === "fr" ? "Changement de coordonnées bancaires" : "Change of bank details";
    await moveAndClick(page.getByText(nuvioSubject, { exact: true }).first());
    await page.waitForTimeout(900);
    const openPane = page.locator("button").filter({ hasText: /^\s*Solen\s*$/ }).first();
    const nuvioResult = await requestAnalysis(() => moveAndClick(openPane), "nuvio");
    const nuvioExpected = lang === "fr" ? /Fraude/ : /fraud/i;
    await verifyVerdict("nuvio", nuvioExpected);
    if (nuvioResult.verdict !== "fraude") throw new Error(`Nuvio expected fraude, received ${nuvioResult.verdict}`);

    const addScene = async (id, selectors, caption, holdMs = 2300) => {
      const box = await boxFromSelectors(page, selectors);
      const start = elapsed() - trimStartSeconds;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
      await page.waitForTimeout(140);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(holdMs);
      const end = elapsed() - trimStartSeconds;
      const scaleX = OUTPUT_WIDTH / WIDTH;
      const scaleY = OUTPUT_HEIGHT / HEIGHT;
      scenes.push({
        id,
        rawStart: Number(start.toFixed(3)),
        rawEnd: Number(end.toFixed(3)),
        box: {
          x: Math.round(box.x * scaleX),
          y: Math.round(box.y * scaleY),
          width: Math.round(box.width * scaleX),
          height: Math.round(box.height * scaleY),
        },
        caption,
      });
    };

    await addScene("nuvio-infobar", ['[data-mail="nuvio"] [data-tour="infobar"]'], captions[lang].nuvio);
    await addScene(
      "nuvio-verdict-reasons",
      [
        '[data-mail="nuvio"] [data-tour="verdict"]',
        '[data-tour="pane"][data-mail="nuvio"] section:has-text("IBAN")',
      ],
      captions[lang].reasons,
    );
    await addScene("nuvio-callback", ['[data-mail="nuvio"] [data-tour="callback"]'], captions[lang].callback);

    const dafSubject = lang === "fr" ? /Urgent.*Lumio Data/ : /Urgent.*Lumio Data/;
    const dafResult = await requestAnalysis(() => moveAndClick(page.getByText(dafSubject).first()), "daf");
    await verifyVerdict("daf", lang === "fr" ? /Aucune anomalie/ : /No anomaly/);
    if (dafResult.verdict !== "fiable") throw new Error(`DAF expected fiable, received ${dafResult.verdict}`);
    await addScene("daf-verdict", ['[data-mail="daf"] [data-tour="verdict"]'], captions[lang].daf);

    const pdgSubject = lang === "fr" ? "Virement confidentiel" : "Confidential transfer";
    const pdgResult = await requestAnalysis(() => moveAndClick(page.getByText(pdgSubject, { exact: true }).first()), "pdg");
    await verifyVerdict("pdg", lang === "fr" ? /Fraude/ : /fraud/i);
    if (pdgResult.verdict !== "fraude") throw new Error(`PDG expected fraude, received ${pdgResult.verdict}`);
    const pdgPaneText = await page.locator('[data-tour="pane"][data-mail="pdg"]').innerText();
    const pdgReason = pdgPaneText
      .split("\n")
      .map((line) => line.trim())
      .find((line) => (lang === "fr" ? /PDG n'écrit pas depuis Gmail/i : /CEO does not write from Gmail/i).test(line));
    if (!pdgReason) throw new Error(`Could not find the displayed PDG reason: ${pdgPaneText}`);
    await addScene(
      "pdg-mail-verdict",
      ['[data-mail="pdg"] [data-tour="mail"]', '[data-mail="pdg"] [data-tour="verdict"]'],
      pdgReason,
    );

    await page.waitForTimeout(1700);
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
    if (ratio !== "28/28") console.warn(`Attack page reports ${ratio}, not 28/28 (${totalCases} replayed cases total).`);
    const attackCaption = captions[lang].attacks(totalCases, ratio, falseAlarms, genuine);
    await addScene("attack-summary", ['section[aria-live="polite"]'], attackCaption);

    await page.mouse.move(WIDTH * 0.72, HEIGHT * 0.78, { steps: 16 });
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(450);
    await addScene("attack-list", ["ol > li:nth-child(-n+3)"], attackCaption, 1900);

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
    const exampleCaption = hasRecordedFallback ? captions[lang].exampleFallback : captions[lang].example;
    await addScene("try-lookalike-example", ['[data-tour="pane"]'], exampleCaption);

    const rawVideo = path.join(WORK, `demo-solen-${lang}.webm`);
    const temporaryVideo = await video.path();
    await context.close();
    await rename(temporaryVideo, rawVideo);
    const timeline = {
      language: lang,
      capture: {
        viewport: { width: WIDTH, height: HEIGHT },
        recordVideo: { width: WIDTH, height: HEIGHT },
        output: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT },
        zoom: false,
        reason: "html zoom 1.5 expanded the 100vh app layout past the 1200px frame; using the requested 1440x900 fallback.",
      },
      sourceVideo: path.basename(rawVideo),
      trimStartSeconds: Number(trimStartSeconds.toFixed(3)),
      analysisSources,
      attackSummary: { totalCases, stopped: ratio, falseAlarms, genuine },
      scenes,
    };
    await writeFile(path.join(WORK, `demo-solen-${lang}.timeline.json`), `${JSON.stringify(timeline, null, 2)}\n`);
    console.log(`Recorded ${lang}: ${rawVideo}`);
    console.log(`Timeline: ${path.join(WORK, `demo-solen-${lang}.timeline.json`)}`);
    console.log(`Analysis sources: ${analysisSources.map(({ mail, ai, verdict }) => `${mail}=${ai}/${verdict}`).join(", ")}`);
  } catch (error) {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw error;
  }
  await browser.close();
};

await main();
