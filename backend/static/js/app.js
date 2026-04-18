const api = {
  models: "/models",
  search: "/models/search",
  filter: "/models/filter",
  modelDetail: (id) => `/models/${encodeURIComponent(id)}`,
  predict: "/predict",
  benchmarks: "/benchmarks",
  benchmarkRun: "/benchmarks/run",
  pricing: "/usage/pricing",
};

async function getJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function card(model) {
  return `
    <article class="model-card">
      <h3>${model.name}</h3>
      <p>${model.description}</p>
      <p><strong>Tier:</strong> ${model.pricing_tier} | <strong>Status:</strong> ${model.status}</p>
      <a class="btn" href="/app/models/${model.model_id}">Open Model</a>
      <div class="tag-row">${(model.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
    </article>
  `;
}

async function initModelsPage() {
  const list = document.getElementById("modelList");
  const searchInput = document.getElementById("searchInput");
  const tagFilter = document.getElementById("tagFilter");
  const plantFilter = document.getElementById("plantFilter");
  const diseaseFilter = document.getElementById("diseaseFilter");
  const tierFilter = document.getElementById("tierFilter");

  const render = (models) => {
    list.innerHTML = models.length ? models.map(card).join("") : "<p>No models found.</p>";
  };

  render(await getJson(api.models));

  document.getElementById("searchBtn").onclick = async () => {
    render(await getJson(`${api.search}?q=${encodeURIComponent(searchInput.value.trim())}`));
  };
  document.getElementById("filterBtn").onclick = async () => {
    const qs = new URLSearchParams({
      tags: tagFilter.value.trim(),
      plant: plantFilter.value.trim(),
      disease: diseaseFilter.value.trim(),
      tier: tierFilter.value.trim(),
    });
    render(await getJson(`${api.filter}?${qs.toString()}`));
  };
}

async function initModelDetailPage() {
  const out = document.getElementById("modelDetailOutput");
  const modelId = out.dataset.modelId;
  out.textContent = JSON.stringify(await getJson(api.modelDetail(modelId)), null, 2);
}

async function initPredictPage() {
  const models = await getJson(api.models);
  const select = document.getElementById("modelSelect");
  const output = document.getElementById("predictOutput");
  models.forEach((m) => {
    const o = document.createElement("option");
    o.value = m.model_id;
    o.textContent = `${m.name} (${m.model_id})`;
    select.appendChild(o);
  });
  document.getElementById("predictForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const image = document.getElementById("imageInput").files[0];
    if (!image) {
      output.textContent = "Choose an image first.";
      return;
    }
    const form = new FormData();
    form.append("image", image);
    form.append("model_id", select.value);
    form.append("top_k", document.getElementById("topkInput").value);
    form.append("user_id", document.getElementById("userInput").value || "anonymous");

    const res = await fetch(api.predict, { method: "POST", body: form });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  });
}

async function initBenchmarksPage() {
  const models = await getJson(api.models);
  const select = document.getElementById("benchmarkModelSelect");
  const out = document.getElementById("benchmarkOutput");
  models.forEach((m) => {
    const o = document.createElement("option");
    o.value = m.model_id;
    o.textContent = m.name;
    select.appendChild(o);
  });
  const refresh = async () => {
    out.textContent = JSON.stringify(await getJson(`${api.benchmarks}?model_id=${select.value}`), null, 2);
  };
  await refresh();
  document.getElementById("refreshBenchmarksBtn").onclick = refresh;
  document.getElementById("runBenchmarkBtn").onclick = async () => {
    const manifestPath = document.getElementById("manifestPathInput").value.trim();
    const payload = { model_id: select.value, dataset_name: "ui_run", sample_count: 16 };
    if (manifestPath) payload.manifest_path = manifestPath;
    const res = await fetch(api.benchmarkRun, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  };
}

async function initPricingPage() {
  const tiers = await getJson(api.pricing);
  const wrap = document.getElementById("pricingCards");
  wrap.innerHTML = tiers
    .map(
      (tier) => `
      <article class="panel">
        <h3>${tier.tier.toUpperCase()}</h3>
        <p>${tier.description}</p>
        <p><strong>Daily quota:</strong> ${tier.daily_quota < 0 ? "Unlimited" : tier.daily_quota}</p>
      </article>
    `
    )
    .join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    switch (window.PAGE_TYPE) {
      case "models":
        await initModelsPage();
        break;
      case "model-detail":
        await initModelDetailPage();
        break;
      case "predict":
        await initPredictPage();
        break;
      case "benchmarks":
        await initBenchmarksPage();
        break;
      case "pricing":
        await initPricingPage();
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(err);
  }
});
