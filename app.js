const CITIES = [
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Lymhurst",
  "Caerleon",
  "Black Market"
];

let allItems = [];
let filteredItems = [];

const searchInput = document.getElementById("searchInput");
const buyCityFilter = document.getElementById("buyCityFilter");
const sellCityFilter = document.getElementById("sellCityFilter");
const minProfitInput = document.getElementById("minProfitInput");
const taxInput = document.getElementById("taxInput");
const batchSizeInput = document.getElementById("batchSizeInput");

const loadItemsBtn = document.getElementById("loadItemsBtn");
const scanAllBtn = document.getElementById("scanAllBtn");
const scanFilteredBtn = document.getElementById("scanFilteredBtn");

const statusEl = document.getElementById("status");
const progressFill = document.getElementById("progressFill");
const itemsCountEl = document.getElementById("itemsCount");
const itemsPreviewEl = document.getElementById("itemsPreview");
const resultsEl = document.getElementById("results");

function initCityFilters() {
  for (const city of CITIES) {
    const opt1 = document.createElement("option");
    opt1.value = city;
    opt1.textContent = city;
    buyCityFilter.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = city;
    opt2.textContent = city;
    sellCityFilter.appendChild(opt2);
  }
}

function setStatus(text) {
  statusEl.innerHTML = text;
}

function setProgress(percent) {
  progressFill.style.width = `${percent}%`;
}

function formatNumber(num) {
  return Number(num || ).toLocaleString("es-ES");
}

function calculateNetProfit(buyPrice, sellPrice, taxPercent) {
  const tax = sellPrice * (taxPercent / 100);
  return sellPrice - buyPrice - tax;
}

function renderItemsPreview(items) {
  itemsCountEl.textContent = `${items.length} items cargados`;
  itemsPreviewEl.innerHTML = "";

  items.slice(, 40).forEach(item => {
    const div = document.createElement("div");
    div.className = "tag";
    div.textContent = `${item.name} (${item.id})`;
    itemsPreviewEl.appendChild(div);
  });

  if (items.length > 40) {
    const more = document.createElement("div");
    more.className = "tag";
    more.textContent = `+ ${items.length - 40} más`;
    itemsPreviewEl.appendChild(more);
  }
}

async function loadItems() {
  try {
    setStatus("Cargando items locales...");
    const res = await fetch("./data/items.json");

    if (!res.ok) {
      throw new Error("No se pudo abrir items.json");
    }

    allItems = await res.json();
    filteredItems = [...allItems];
    renderItemsPreview(allItems);
    setStatus(`Items cargados correctamente: ${allItems.length}`);
  } catch (error) {
    console.error(error);
    setStatus("Error cargando items.json");
  }
}

function applySearchFilter() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    filteredItems = [...allItems];
  } else {
    filteredItems = allItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  }

  renderItemsPreview(filteredItems);
  setStatus(`Filtro aplicado. ${filteredItems.length} items listos.`);
}

async function fetchPricesForItems(itemsBatch) {
  const itemIds = itemsBatch.map(i => i.id).join(",");
  const locations = CITIES.join(",");
  const url = `https://west.albion-online-data.com/api/v2/stats/prices/${encodeURIComponent(itemIds)}?locations=${encodeURIComponent(locations)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Error consultando la API");
  }

  return await res.json();
}

function analyzeOpportunities(apiData, sourceItems, minProfit, taxPercent, buyFilter, sellFilter) {
  const grouped = {};

  for (const row of apiData) {
    if (!grouped[row.item_id]) grouped[row.item_id] = [];
    grouped[row.item_id].push(row);
  }

  const opportunities = [];

  for (const item of sourceItems) {
    const rows = grouped[item.id] || [];

    const validRows = rows.filter(r => r.sell_price_min && r.sell_price_min > );

    if (validRows.length < 2) continue;

    let cheapest = null;
    let expensive = null;

    for (const row of validRows) {
      if (buyFilter && row.city !== buyFilter) continue;
      if (!cheapest || row.sell_price_min < cheapest.sell_price_min) {
        cheapest = row;
      }
    }

    for (const row of validRows) {
      if (sellFilter && row.city !== sellFilter) continue;
      if (!expensive || row.sell_price_min > expensive.sell_price_min) {
        expensive = row;
      }
    }

    if (!cheapest || !expensive) continue;
    if (cheapest.city === expensive.city) continue;
    if (expensive.sell_price_min <= cheapest.sell_price_min) continue;

    const grossProfit = expensive.sell_price_min - cheapest.sell_price_min;
    const netProfit = calculateNetProfit(
      cheapest.sell_price_min,
      expensive.sell_price_min,
      taxPercent
    );

    if (netProfit < minProfit) continue;

    opportunities.push({
      itemName: item.name,
      itemId: item.id,
      buyCity: cheapest.city,
      buyPrice: cheapest.sell_price_min,
      sellCity: expensive.city,
      sellPrice: expensive.sell_price_min,
      grossProfit,
      netProfit,
      buyDate: cheapest.sell_price_min_date || "N/D",
      sellDate: expensive.sell_price_min_date || "N/D"
    });
  }

  opportunities.sort((a, b) => b.netProfit - a.netProfit);
  return opportunities;
}

function renderResults(opps) {
  resultsEl.innerHTML = "";

  if (!opps.length) {
    resultsEl.innerHTML = `<p class="muted">No se encontraron oportunidades con esos filtros.</p>`;
    return;
  }

  opps.forEach((opp, index) => {
    const div = document.createElement("div");
    div.className = "result-card";

    div.innerHTML = `
      <h3>#${index + 1} - ${opp.itemName}</h3>
      <div class="row"><span class="muted">ID:</span> ${opp.itemId}</div>
      <div class="row"><span class="good">Comprar en:</span> ${opp.buyCity} por ${formatNumber(opp.buyPrice)}</div>
      <div class="row"><span class="bad">Vender en:</span> ${opp.sellCity} por ${formatNumber(opp.sellPrice)}</div>
      <div class="row"><span class="warn">Ganancia bruta:</span> ${formatNumber(opp.grossProfit)}</div>
      <div class="row"><span class="good">Ganancia neta estimada:</span> ${formatNumber(Math.round(opp.netProfit))}</div>
      <div class="row muted">Actualización compra: ${opp.buyDate}</div>
      <div class="row muted">Actualización venta: ${opp.sellDate}</div>
    `;

    resultsEl.appendChild(div);
  });
}

async function scanItems(source) {
  if (!source.length) {
    setStatus("No hay items para escanear.");
    return;
  }

  const batchSize = parseInt(batchSizeInput.value) || 50;
  const minProfit = parseInt(minProfitInput.value) || ;
  const taxPercent = parseFloat(taxInput.value) || 6.5;
  const buyFilter = buyCityFilter.value;
  const sellFilter = sellCityFilter.value;

  const batches = [];
  for (let i = ; i < source.length; i += batchSize) {
    batches.push(source.slice(i, i + batchSize));
  }

  let allApiData = [];

  setStatus(`Escaneando ${source.length} items en ${batches.length} lote(s)...`);
  setProgress();

  for (let i = ; i < batches.length; i++) {
    const batch = batches[i];

    try {
      setStatus(`Consultando lote ${i + 1} de ${batches.length}...`);
      const data = await fetchPricesForItems(batch);
      allApiData = allApiData.concat(data);
    } catch (error) {
      console.error(error);
      setStatus(`Error en lote ${i + 1}. Se continúa con el siguiente.`);
    }

    const percent = Math.round(((i + 1) / batches.length) * 100);
    setProgress(percent);

    await new Promise(resolve => setTimeout(resolve, 600));
  }

  setStatus("Analizando oportunidades...");
  const opportunities = analyzeOpportunities(
    allApiData,
    source,
    minProfit,
    taxPercent,
    buyFilter,
    sellFilter
  );

  renderResults(opportunities);
  setStatus(`Escaneo terminado. Oportunidades encontradas: ${opportunities.length}`);
}

loadItemsBtn.addEventListener("click", loadItems);
scanAllBtn.addEventListener("click", () => scanItems(allItems));
scanFilteredBtn.addEventListener("click", () => scanItems(filteredItems));
searchInput.addEventListener("input", applySearchFilter);

initCityFilters();
loadItems();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("Service Worker registrado"))
    .catch(err => console.log("Error registrando Service Worker", err));
}
