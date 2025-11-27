// Read ?id= from the URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadData() {
  const url = `https://moment-cf83ed32.base44.app/api/apps/69023ddd9333e12fcf83ed32/functions/yyovvoGet?id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  const raw = await res.json();
  return raw.data?.fields || raw.data || raw;
}

async function init() {
  const data = await loadData();

  const introVideo = document.getElementById("intro-video");
  const introText = document.getElementById("intro-text");
  const messageText = document.getElementById("message-text");
  const outro = document.getElementById("outro-overlay");
  const jingle = document.getElementById("jingle");

  // --- TIMELINE (TEST VERSION) ---
  const INTRO_AT = 3000;   // 3s
  const MESSAGE_AT = 6000; // 6s
  const OUTRO_AT = 7000;   // mood video ends at ~7s

  // --- INTRO TEXT ---
  setTimeout(() => {
    introText.textContent = data.intro_text || "";
    introText.classList.add("show");
  }, INTRO_AT);

  // --- MESSAGE TEXT ---
  setTimeout(() => {
    messageText.textContent = data.content_text || "";
    messageText.classList.add("show");
  }, MESSAGE_AT);

  // --- OUTRO ---
  setTimeout(() => {
    outro.classList.add("show");
    jingle.play().catch(() => {});
  }, OUTRO_AT);
}

init();
