console.log("app.js cargó");

const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const searchBtn = document.getElementById("searchBtn");
const itemInput = document.getElementById("itemInput");

if (statusEl) statusEl.innerHTML = "JavaScript cargado";

searchBtn.addEventListener("click", async () => {
  const item = itemInput.value.trim().toUpperCase();

  statusEl.innerHTML = "Botón funcionando...";

  if (!item) {
    statusEl.innerHTML = "Escribe un item.";
    return;
  }

  try {
    const url = `https://west.albion-online-data.com/api/v2/stats/prices/${item}?locations=Bridgewatch,Martlock,Thetford,Fort%20Sterling,Lymhurst,Caerleon,Black%20Market`;

    statusEl.innerHTML = "Consultando API...";
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === ) {
      statusEl.innerHTML = "No se encontraron datos.";
      resultsEl.innerHTML = "";
      return;
    }

    statusEl.innerHTML = `Datos recibidos: ${data.length}`;

    resultsEl.innerHTML = data.map(row => `
      <div style="background:#18202a;padding:12px;border-radius:12px;margin:10px ;">
        <div><b>${row.city}</b></div>
        <div>Sell Min: ${row.sell_price_min || "N/A"}</div>
        <div>Buy Max: ${row.buy_price_max || "N/A"}</div>
        <div style="font-size:12px;color:#aaa;">${row.sell_price_min_date || "Sin fecha"}</div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    statusEl.innerHTML = "Error consultando la API.";
  }
});
