import React, { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function Admin() {
  const [phase, setPhase] = useState("chiusa");
  const [auctions, setAuctions] = useState([]);

  async function load() {
    const p = await api("/admin/phase");
    setPhase(p.phase);
    const a = await api("/auctions");
    setAuctions(a);
  }

  useEffect(() => {
    load();
  }, []);

  async function call(path) {
    const r = await api(path, "POST");
    if (r.error) alert(r.error);
    else load();
  }

  async function cancel(id) {
    if (!confirm("Annullare asta?")) return;
    const r = await api(`/admin/auctions/${id}/cancel`, "POST");
    if (r.error) alert(r.error);
    else load();
  }

  async function resetRosters() {
    if (!confirm("Reset ROSE allo stato del JSON?")) return;
    const r = await api("/admin/reset-rosters", "POST");
    if (r.error) alert(r.error);
    else alert("Rose resettate correttamente.");
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Admin</h2>

      <div>Fase corrente: <b>{phase}</b></div>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button className="btn" onClick={() => call("/admin/phase/open-svincoli")}>
          Apri Svincoli
        </button>
        <button className="btn" onClick={() => call("/admin/phase/close-svincoli")}>
          Chiudi Svincoli
        </button>
        <button className="btn" onClick={() => call("/admin/phase/open-aste")}>
          Apri Aste
        </button>
        <button className="btn" onClick={() => call("/admin/phase/close-aste")}>
          Chiudi Aste
        </button>
      </div>

      <button className="btn btn-danger" onClick={resetRosters}>
        Reset ROSE (dal JSON)
      </button>

      <h3 style={{ marginTop: 20 }}>Aste aperte</h3>

      <ul>
        {auctions
          .filter((a) => a.status === "open")
          .map((a) => (
            <li key={a.id}>
              {a.player_name} · {a.role}{" "}
              <button className="btn" onClick={() => cancel(a.id)}>
                Annulla
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
