const API_BASE = "http://127.0.0.1:8000";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const filterBtn = document.getElementById("filterBtn");
const tagFilter = document.getElementById("tagFilter");
const plantFilter = document.getElementById("plantFilter");
const diseaseFilter = document.getElementById("diseaseFilter");
const tierFilter = document.getElementById("tierFilter");
const modelList = document.getElementById("modelList");
const modelSelect = document.getElementById("modelSelect");
const modelSelectDetail = document.getElementById("modelSelectDetail");
const predictForm = document.getElementById("predictForm");
const imageInput = document.getElementById("imageInput");
const topkInput = document.getElementById("topkInput");
const predictOutput = document.getElementById("predictOutput");
const modelDetailOutput = document.getElementById("modelDetailOutput");
const benchmarkModelSelect = document.getElementById("benchmarkModelSelect");
const runBenchmarkBtn = document.getElementById("runBenchmarkBtn");
const refreshBenchmarksBtn = document.getElementById("refreshBenchmarksBtn");
const benchmarkOutput = document.getElementById("benchmarkOutput");

async function fetchModels(query = "") {
  const url = query
    ? `${API_BASE}/models/search?q=${encodeURIComponent(query)}`
    : `${API_BASE}/models`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load models.");
  }
  return res.json();
}

async function fetchFilteredModels() {
  const params = new URLSearchParams();
  if (tagFilter.value.trim()) params.set("tags", tagFilter.value.trim());
  if (plantFilter.value.trim()) params.set("plant", plantFilter.value.trim());
  if (diseaseFilter.value.trim()) params.set("disease", diseaseFilter.value.trim());
  if (tierFilter.value.trim()) params.set("tier", tierFilter.value.trim());
  const res = await fetch(`${API_BASE}/models/filter?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to filter models.");
  return res.json();
}

async function fetchModelDetail(modelId) {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(modelId)}`);
  if (!res.ok) throw new Error("Failed to load model detail.");
  return res.json();
}

async function fetchBenchmarks(modelId = "") {
  const url = modelId
    ? `${API_BASE}/benchmarks?model_id=${encodeURIComponent(modelId)}`
    : `${API_BASE}/benchmarks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load benchmarks.");
  return res.json();
}

async function runBenchmark(modelId) {
  const res = await fetch(`${API_BASE}/benchmarks/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model_id: modelId,
      dataset_name: "ui_quick_sanity",
      sample_count: 32,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Benchmark failed");
  return data;
}

function renderModels(models) {
  modelList.innerHTML = "";
  modelSelect.innerHTML = "";
  modelSelectDetail.innerHTML = "";
  benchmarkModelSelect.innerHTML = "";
  models.forEach((model) => {
    const li = document.createElement("li");
    li.textContent =
      `${model.name} (${model.model_id})` +
      ` | tags: ${model.tags.join(", ")}` +
      ` | plants: ${model.supported_plants.join(", ")}` +
      ` | tier: ${model.pricing_tier}`;
    modelList.appendChild(li);

    const option = document.createElement("option");
    option.value = model.model_id;
    option.textContent = `${model.name} - ${model.version}`;
    modelSelect.appendChild(option);
    const detailOption = document.createElement("option");
    detailOption.value = model.model_id;
    detailOption.textContent = `${model.name} (${model.model_id})`;
    modelSelectDetail.appendChild(detailOption);

    const benchmarkOption = document.createElement("option");
    benchmarkOption.value = model.model_id;
    benchmarkOption.textContent = `${model.name} (${model.model_id})`;
    benchmarkModelSelect.appendChild(benchmarkOption);
  });
}

async function refreshModelDetail() {
  if (!modelSelectDetail.value) return;
  try {
    const detail = await fetchModelDetail(modelSelectDetail.value);
    modelDetailOutput.textContent = JSON.stringify(detail, null, 2);
  } catch (error) {
    modelDetailOutput.textContent = `Model detail error: ${error.message}`;
  }
}

async function refreshBenchmarks() {
  try {
    const modelId = benchmarkModelSelect.value || "";
    const runs = await fetchBenchmarks(modelId);
    benchmarkOutput.textContent = JSON.stringify(runs, null, 2);
  } catch (error) {
    benchmarkOutput.textContent = `Benchmark load error: ${error.message}`;
  }
}

function renderEmptyState() {
  modelList.innerHTML = "<li>No models match the current criteria.</li>";
  modelSelect.innerHTML = "";
  modelSelectDetail.innerHTML = "";
  benchmarkModelSelect.innerHTML = "";
  modelDetailOutput.textContent = "No model selected.";
}

async function applyAndRenderModels(modelsPromise) {
  try {
    const models = await modelsPromise;
    if (!models.length) {
      renderEmptyState();
      return;
    }
    renderModels(models);
    await refreshModelDetail();
    await refreshBenchmarks();
  } catch (error) {
    predictOutput.textContent = `Model loading failed: ${error.message}`;
  }
}

async function loadInitialModels() {
  await applyAndRenderModels(fetchModels());
}

searchBtn.addEventListener("click", async () => {
  await applyAndRenderModels(fetchModels(searchInput.value.trim()));
});

filterBtn.addEventListener("click", async () => {
  await applyAndRenderModels(fetchFilteredModels());
});

modelSelectDetail.addEventListener("change", refreshModelDetail);
benchmarkModelSelect.addEventListener("change", refreshBenchmarks);

runBenchmarkBtn.addEventListener("click", async () => {
  if (!benchmarkModelSelect.value) {
    benchmarkOutput.textContent = "Select a model before running benchmark.";
    return;
  }
  benchmarkOutput.textContent = "Running benchmark...";
  try {
    const result = await runBenchmark(benchmarkModelSelect.value);
    benchmarkOutput.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    benchmarkOutput.textContent = `Benchmark error: ${error.message}`;
  }
});

refreshBenchmarksBtn.addEventListener("click", refreshBenchmarks);

predictForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!imageInput.files[0]) {
    predictOutput.textContent = "Please choose an image.";
    return;
  }

  const form = new FormData();
  form.append("image", imageInput.files[0]);
  form.append("model_id", modelSelect.value);
  form.append("top_k", topkInput.value);

  predictOutput.textContent = "Running prediction...";
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Prediction failed");
    }
    predictOutput.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    predictOutput.textContent = `Prediction error: ${error.message}`;
  }
});

loadInitialModels();
