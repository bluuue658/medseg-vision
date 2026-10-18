const $ = (selector) => document.querySelector(selector);

const DEMO_DURATION_MS = 5000;
const DEFAULT_RESULT_URL = "./assets/demo-segmentation-result.webp";
const PAGE_SIZE = 12;
let selectedCategory = "大脑";
let selectedSource = null;
let running = false;
let libraryItems = [];
let filteredItems = [];
let libraryPage = 1;

const runButton = $("#runModel");
const hero = $("#hero");

function setWorkflowStage(stage) {
  const order = ["upload", "analyze", "result"];
  const activeIndex = Math.max(0, order.indexOf(stage));
  document.querySelectorAll("#workflowRail span").forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
    item.classList.toggle("complete", index < activeIndex);
  });
}

function updateProgress(progress, stage) {
  const bounded = Math.max(0, Math.min(100, Number(progress) || 0));
  $("#progressBar").style.width = `${bounded}%`;
  $("#progressValue").textContent = `${Math.round(bounded)}%`;
  $("#progressText").textContent = stage;
}

function resetResult() {
  $("#resultContent").classList.remove("show");
  $("#resultEmpty").classList.remove("hide", "processing");
  $("#emptyTitle").textContent = "结果将在这里显示";
  $("#emptyCopy").textContent = "选择具体图像并开始分析，系统将自动展示预设分割结果。";
  $("#resultStatus").textContent = selectedSource ? "图像已就绪" : "等待选择";
  $("#runProgress").classList.remove("show");
  updateProgress(0, "等待开始");
}

function updateRunAvailability() {
  runButton.disabled = !selectedSource || running;
  $("#runModelHint").textContent = running
    ? "正在生成演示结果"
    : selectedSource
      ? "图像已就绪，点击开始"
      : `请在${selectedCategory}类别中选择图像`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
}

function selectCategory(category) {
  if (running) return showToast("演示进行中", "请等待当前演示完成");
  selectedCategory = category;
  selectedSource = null;
  libraryPage = 1;
  $("#librarySearch").value = "";
  document.querySelectorAll("#datasetPicker button").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  $("#librarySelection").className = "library-selection";
  $("#librarySelection").innerHTML = "<i></i><span>请选择一张具体图像</span>";
  applyLibraryFilters();
  resetResult();
  setWorkflowStage("upload");
  updateRunAvailability();
}

function selectLibraryItem(item) {
  if (running) return showToast("演示进行中", "请等待当前演示完成");
  selectedSource = { item, result: item.result || DEFAULT_RESULT_URL };
  document.querySelectorAll(".library-card").forEach((card) => card.classList.toggle("selected", card.dataset.id === item.id));
  $("#librarySelection").classList.add("ready");
  $("#librarySelection").innerHTML = `<i></i><span>已选择：${escapeHtml(item.title)}</span>`;
  resetResult();
  setWorkflowStage("analyze");
  updateRunAvailability();
}

function applyLibraryFilters() {
  const query = $("#librarySearch").value.trim().toLowerCase();
  filteredItems = libraryItems.filter((item) => {
    const text = `${item.title} ${item.code || ""}`.toLowerCase();
    return item.category === selectedCategory && (!query || text.includes(query));
  });
  libraryPage = 1;
  renderLibrary();
}

function renderLibrary() {
  const grid = $("#libraryGrid");
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  libraryPage = Math.min(libraryPage, totalPages);
  const start = (libraryPage - 1) * PAGE_SIZE;
  const pageItems = filteredItems.slice(start, start + PAGE_SIZE);
  grid.replaceChildren();
  if (!pageItems.length) {
    const empty = document.createElement("div");
    empty.className = "library-empty";
    empty.textContent = `${selectedCategory}类别中没有匹配的图像`;
    grid.appendChild(empty);
  }
  pageItems.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `library-card${selectedSource?.item.id === item.id ? " selected" : ""}`;
    card.dataset.id = item.id;
    card.innerHTML = `<span class="library-thumb"><img src="${escapeHtml(item.thumbnail || item.input)}" alt="${escapeHtml(item.title)}" loading="lazy"><i>✓</i></span><span class="library-card-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.code || "MED")}</small></span>`;
    card.addEventListener("click", () => selectLibraryItem(item));
    grid.appendChild(card);
  });
  $("#libraryCount").textContent = `当前类别：${selectedCategory} · ${filteredItems.length} 份示例影像`;
  $("#libraryPage").textContent = `${libraryPage} / ${totalPages}`;
  $("#libraryPrev").disabled = libraryPage <= 1;
  $("#libraryNext").disabled = libraryPage >= totalPages;
}

async function loadLibrary() {
  try {
    const response = await fetch("./assets/library/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("manifest unavailable");
    const data = await response.json();
    libraryItems = Array.isArray(data) ? data : [];
  } catch (error) {
    libraryItems = [];
  }
  applyLibraryFilters();
}

function stageForProgress(progress) {
  if (progress < 18) return "正在读取影像";
  if (progress < 42) return "正在标准化图像";
  if (progress < 74) return "正在执行分割推理";
  if (progress < 94) return "正在生成区域轮廓";
  return "正在整理结果";
}

function applyResultMetadata() {
  const item = selectedSource?.item;
  const metrics = item?.metrics || [
    { label: "目标区域", value: "待导入" },
    { label: "分割体积", value: "待导入" },
    { label: "置信度", value: "待导入" }
  ];
  metrics.slice(0, 3).forEach((metric, index) => {
    $(`#metricLabel${index + 1}`).textContent = metric.label;
    $(`#metricValue${index + 1}`).textContent = metric.value;
  });
  $("#resultLabel").textContent = item?.code || "DEMO RESULT";
}

function completeDemo() {
  running = false;
  $("#resultStatus").textContent = "演示完成";
  $("#resultEmpty").classList.add("hide");
  $("#resultEmpty").classList.remove("processing");
  $("#resultContent").classList.add("show");
  $("#demoResult").src = selectedSource?.result || DEFAULT_RESULT_URL;
  $("#demoResult").alt = `${selectedSource?.item.title || "医学影像"}演示结果`;
  applyResultMetadata();
  updateProgress(100, "分割演示完成");
  setWorkflowStage("result");
  updateRunAvailability();
  runButton.querySelector("b").textContent = "重新演示";
  showToast("演示完成", "预设结果已展示");
}

function runDemo() {
  if (!selectedSource || running) return;
  running = true;
  setWorkflowStage("analyze");
  updateRunAvailability();
  $("#resultStatus").textContent = "演示分析中";
  $("#resultContent").classList.remove("show");
  $("#resultEmpty").classList.remove("hide");
  $("#resultEmpty").classList.add("processing");
  $("#emptyTitle").textContent = "AI 正在分析影像";
  $("#emptyCopy").textContent = `正在模拟${selectedCategory}影像的模型推理与轮廓生成，请稍候。`;
  $("#runProgress").classList.add("show");
  const startedAt = performance.now();
  const animate = (now) => {
    const elapsed = Math.min(DEMO_DURATION_MS, now - startedAt);
    const progress = (elapsed / DEMO_DURATION_MS) * 100;
    updateProgress(progress, stageForProgress(progress));
    if (elapsed < DEMO_DURATION_MS) requestAnimationFrame(animate);
    else completeDemo();
  };
  requestAnimationFrame(animate);
}

function downloadResult() {
  const anchor = document.createElement("a");
  anchor.href = selectedSource?.result || DEFAULT_RESULT_URL;
  anchor.download = `${selectedSource?.item.id || "medseg-demo"}-result.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function showToast(title, subtitle) {
  const toast = $("#toast");
  toast.querySelector("b").textContent = title;
  toast.querySelector("small").textContent = subtitle;
  toast.classList.add("show");
  clearTimeout(window.__medsegToast);
  window.__medsegToast = window.setTimeout(() => toast.classList.remove("show"), 3400);
}

document.querySelectorAll("#datasetPicker button").forEach((button) => {
  button.addEventListener("click", () => selectCategory(button.dataset.category));
});
$("#librarySearch").addEventListener("input", applyLibraryFilters);
$("#libraryPrev").addEventListener("click", () => { if (libraryPage > 1) { libraryPage -= 1; renderLibrary(); } });
$("#libraryNext").addEventListener("click", () => { if (libraryPage * PAGE_SIZE < filteredItems.length) { libraryPage += 1; renderLibrary(); } });
$("#heroUpload").addEventListener("click", () => $(".workspace").scrollIntoView({ behavior: "smooth", block: "start" }));
runButton.addEventListener("click", runDemo);
$("#exportResult").addEventListener("click", downloadResult);

if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    hero.style.setProperty("--depth-x", x.toFixed(3));
    hero.style.setProperty("--depth-y", y.toFixed(3));
  });
  hero.addEventListener("pointerleave", () => { hero.style.setProperty("--depth-x", "0"); hero.style.setProperty("--depth-y", "0"); });
}

setWorkflowStage("upload");
resetResult();
updateRunAvailability();
loadLibrary();
