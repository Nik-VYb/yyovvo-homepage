// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

async function loadData() {
  // Base44 yyovvoGet endpoint (ID comes from ?id=...)
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

  console.log("Fetching yyovvo from:", url);
  const res = await fetch(url);

  console.log("Response status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Failed to load yyovvo data. Body:", text);
    throw new Error("Failed to load yyovvo data");
  }

  let raw;
  try {
    raw = await res.json();
  } catch (e) {
    console.error("JSON parse error:", e);
    throw e;
  }

  console.log("Raw yyovvo response:", raw);

  // Unwrap whatever Base44 returns
  let data = raw;
  if (raw.data && (raw.data.fields || raw.data.record)) {
    data = raw.data.fields || raw.data.record;
  } else if (raw.data) {
    data = raw.data;
  } else if (raw.record) {
    data = raw.record;
  } else if (raw.fields) {
    data = raw.fields;
  }

  console.log("Unwrapped yyovvo data:", data);
  return data;
}

async function init() {
  try {
    const data = await loadData();

    const scene = document.getElementById("scene");
    const intro = document.getElementById("overlay-intro");
    const mainText = document.getElementById("overlay-main-text");
    const outro = document.getElementById("overlay-outro");
    const jingle = document.getElementById("yyo-jingle");
    const skin = document.getElementById("skin-overlay");

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // ----- TIMING (ms) -----
    const INTRO_START_MS = 1000; // 1s
    const INTRO_END_MS   = 3500; // 3.5s
    const MAIN_START_MS  = 3500; // 3.5s
    const SKIN_START_MS  = 3200; // skin fades in just before main
    const MAIN_DURATION_MS = (Number(data.content_duration) || 10) * 1000;
    const OUTRO_START_MS = MAIN_START_MS + MAIN_DURATION_MS;

    // ----- 1) M O O D  (full screen, immediate) -----
    // For launch we IGNORE Base44’s mood URL and always use mood01
    const moodUrl = "/videos/mood01.mp4";

    scene.loop = false;
    scene.src = moodUrl;
    await scene.play().catch(() => {
      // autoplay might fail on some mobiles – but we try
    });

    // ----- 2) I N T R O  T E X T -----
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text || "";
        intro.classList.add("show");
      } else {
        console.warn("No intro_text in data");
      }
    }, INTRO_START_MS);

    setTimeout(() => {
      intro.classList.remove("show");
    }, INTRO_END_MS);

    // ----- 3) S K I N  F A D E - I N -----
    // For launch we always use skin01
    if (skin) {
      skin.style.backgroundImage = 'url("/skins/skin01.png")';
      setTimeout(() => {
        skin.classList.add("show");
      }, SKIN_START_MS);
    }

    // ----- 4) M A I N  M O M E N T -----
    if (data.content_type === "text") {
      setTimeout(() => {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      }, MAIN_START_MS);
    } else if (data.content_type === "audio") {
      const audio = new Audio(data.content_url);
      setTimeout(() => {
        audio.play().catch(() => {});
      }, MAIN_START_MS);
    } else if (data.content_type === "video") {
      setTimeout(() => {
        if (data.content_url) {
          scene.src = data.content_url;
          scene.play().catch(() => {});
        } else {
          console.warn("content_type=video but no content_url");
        }
      }, MAIN_START_MS);
    } else {
      console.warn("Unknown content_type:", data.content_type);
    }

    // ----- 5) O U T R O  (snow + logo + jingle) -----
    setTimeout(() => {
      // hide main text so it doesn’t overlap "yyovvo"
      mainText.classList.remove("show");

      // hide skin so snow is fully visible
      if (skin) {
        skin.classList.remove("show");
      }

      // switch to snow outro loop
      scene.src = "/videos/outro-snow.mp4";
      scene.loop = true;
      scene.play().catch(() => {});

      // show outro text
      outro.classList.remove("hidden");
      outro.classList.add("show");

      // play jingle exactly with outro (may require tap on some mobiles)
      jingle.play().catch(() => {});
    }, OUTRO_START_MS);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
