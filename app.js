pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

const textBox   = document.getElementById("text");
const fileInput = document.getElementById("pdf");
const fileName  = document.getElementById("file-name");
const goBtn     = document.getElementById("go");
const loading   = document.getElementById("loading");
const out       = document.getElementById("out");
const wcSpan    = document.getElementById("wc");
const freqList  = document.getElementById("freq");
const summaryEl = document.getElementById("sum");

fileInput.addEventListener("change", () => {
  const f = fileInput.files[0];
  fileName.textContent = f ? "Selected: " + f.name : "";
});

async function extractPdfText(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const c = await page.getTextContent();
    text += c.items.map(it => it.str || "").join(" ") + "\n";
  }
  return text.trim();
}

function analyzeLocally(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const counts = {};
  words.filter(w => w.length > 2).forEach(w => counts[w] = (counts[w] || 0) + 1);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { wordCount: words.length, top };
}

async function getSummary(text) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }
  return data.summary;
}

goBtn.addEventListener("click", async () => {
  const typed = textBox.value.trim();
  const pdf = fileInput.files[0];
  let text = typed;

  out.classList.add("hidden");
  loading.classList.remove("hidden");

  if (pdf) {
    loading.textContent = "Reading PDF...";
    try {
      text = await extractPdfText(pdf);
      if (!text || text.length < 5)
        throw new Error("No readable text. PDF may be a scanned image.");
    } catch (e) {
      alert("Could not read PDF:\n" + e.message);
      loading.classList.add("hidden");
      return;
    }
  }

  if (!text) {
    alert("Please type text or choose a PDF.");
    loading.classList.add("hidden");
    return;
  }

  const { wordCount, top } = analyzeLocally(text);
  wcSpan.textContent = wordCount;
  freqList.innerHTML = top.map(([w, n]) => `<li>${w} (${n})</li>`).join("");

  loading.textContent = "Summarizing...";
  try {
    summaryEl.textContent = await getSummary(text);
    out.classList.remove("hidden");
  } catch (e) {
    alert("AI error:\n" + e.message);
  } finally {
    loading.classList.add("hidden");
  }
});