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

searchBtn.addEventListener("click", buscarItem);

async function buscarItem() {
  const itemId = itemInput.value.trim().toUpperCase();

  if (!itemId) {
    statusEl.textContent = "Escribe un item ID.";
    return;
  }

  statusEl.textContent = "Consultando API...";
  resultsEl.innerHTML = "";

  const locations = cities.join(",");
  const url = `https://west.albion-online-data.com/api/v2/stats/prices/${itemId}?locations=${encodeURIComponent(locations)}`;

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

    valid.sort((a, b) => a.sell_price_min - b.sell_price_min);

    statusEl.textContent = `Resultados para ${itemId}`;

    let html = "";

    for (const row of valid) {
      html += `
        <div class="card">
          <strong>${row.city}</strong><br>
          Precio venta mínimo: ${row.sell_price_min}<br>
          Precio compra máximo: ${row.buy_price_max || "N/A"}<br>
          Actualizado: ${row.sell_price_min_date || "N/A"}
        </div>
      `;
    }

    resultsEl.innerHTML = html;

  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error consultando la API.";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
