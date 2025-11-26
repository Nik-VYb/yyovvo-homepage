// Read ?id= from the URL, e.g. /v/?id=UUID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  console.error("No yyovvo id provided in URL (?id=...)");
}

async function loadData() {
  // Call the REAL Base44 yyovvoGet function with ?id=
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(
    id
  )}`;

  console.log("Fetching yyovvo from:", url);

  const res = await fetch(url);
  console.log("Response status:", res.status);

  if (!res.ok) {
    // If the network worked but API returned 4xx/5xx
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

  // Try to unwrap the actual data regardless of shape
  let data = raw;

  if (raw.data && !raw.data.mood_video_url && (raw.data.fields || raw.data.record)) {
    // Some Base44 patterns wrap in data.fields or data.record
    data = raw.data.fields || raw.data.record;
  } else if (raw.data && (raw.data.mood_video_url || raw.data.content_type)) {
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

    if (!data) {
      console.error("No data returned from yyovvoGet");
      return;
    }

    console.log("Playing yyovvo with data:", data);

    // 1) Play Mood video
    if (data.mood_video_url) {
      scene.src = data.mood_video_url;
    } else {
      console.warn("No mood_video_url in data");
    }

    await scene.play().catch(() => {
      // Autoplay might fail on some browsers if not muted; we already set muted in HTML.
    });

    // Intro appears at 5 seconds
    setTimeout(() => {
      if (data.intro_text) {
        intro.textContent = data.intro_text || "";
        intro.classList.add("show");
      } else {
        console.warn("No intro_text in data");
      }
    }, 5000);

    // Hide intro after 3 seconds
    setTimeout(() => {
      intro.classList.remove("show");
    }, 8000);

    // 2) Main clip logic
    const mainStartMs = 8000;
    const durationMs = (Number(data.content_duration) || 10) * 1000;

    if (data.content_type === "text") {
      setTimeout(() => {
        mainText.textContent = data.content_text || "";
        mainText.classList.add("show");
      }, mainStartMs);
    } else if (data.content_type === "audio") {
      const audio = new Audio(data.content_url);
      setTimeout(() => {
        audio.play().catch(() => {});
      }, mainStartMs);
    } else if (data.content_type === "video") {
      setTimeout(() => {
        if (data.content_url) {
          scene.src = data.content_url;
          scene.play().catch(() => {});
        } else {
          console.warn("content_type=video but no content_url");
        }
      }, mainStartMs);
    } else {
      console.warn("Unknown content_type:", data.content_type);
    }

    // 3) Outro at end of main clip
    const outroStart = mainStartMs + durationMs;

    setTimeout(() => {
      outro.classList.add("show");
      jingle.play().catch(() => {});
    }, outroStart);
  } catch (e) {
    console.error("yyovvo player init error:", e);
  }
}

init();
