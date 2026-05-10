const cities = [
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Lymhurst",
  "Caerleon",
  "Black Market"
];

const itemInput = document.getElementById("itemInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

searchBtn.addEventListener("click", searchItem);

async function searchItem() {
  const item = itemInput.value.trim().toUpperCase();

  if (!item) {
    statusEl.textContent = "Escribe un ID de item.";
    return;
  }

  statusEl.textContent = "Buscando...";
  resultsEl.innerHTML = "";

  const locations = cities.join(",");
  const url = `https://west.albion-online-data.com/api/v2/stats/prices/${item}?locations=${encodeURIComponent(locations)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === ) {
      statusEl.textContent = "No se encontraron datos.";
      return;
    }

    const valid = data.filter(x => x.sell_price_min > );

    if (valid.length === ) {
      statusEl.textContent = "No hay precios válidos.";
      return;
    }

    const barato = valid.reduce((a, b) =>
      a.sell_price_min < b.sell_price_min ? a : b
    );

    const caro = valid.reduce((a, b) =>
      a.sell_price_min > b.sell_price_min ? a : b
    );

    const ganancia = caro.sell_price_min - barato.sell_price_min;

    statusEl.innerHTML = `Resultado para <b>${item}</b>`;

    let html = `
      <div class="card">
        <div><b>Comprar en:</b> ${barato.city} - ${barato.sell_price_min.toLocaleString()}</div>
        <div><b>Vender en:</b> ${caro.city} - ${caro.sell_price_min.toLocaleString()}</div>
        <div><b>Ganancia bruta:</b> ${ganancia.toLocaleString()}</div>
      </div>
    `;

    valid.sort((a, b) => a.sell_price_min - b.sell_price_min);

    valid.forEach(row => {
      html += `
        <div class="card">
          <div><b>${row.city}</b></div>
          <div>Sell Min: ${row.sell_price_min?.toLocaleString() || "N/A"}</div>
          <div>Buy Max: ${row.buy_price_max?.toLocaleString() || "N/A"}</div>
        </div>
      `;
    });

    resultsEl.innerHTML = html;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error consultando la API.";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}
