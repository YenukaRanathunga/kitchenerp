"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Boxes, ClipboardList, Minus, PackagePlus, Pencil, Plus, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Item = { id: number; name: string; category: string; quantity: number; reorderAt: number };
type Movement = { id: number; itemId: number; itemName: string; type: string; quantity: number; createdAt: string };
type Inventory = { items: Item[]; history: Movement[] };
type Modal = { kind: "add" } | { kind: "edit" | "count"; item: Item } | null;
const categories = ["All items", "Kitchen", "Cleaning", "Medical", "Other"];
const emptyForm = { name: "", category: "Kitchen", quantity: 0, reorderAt: 1 };

export default function Home() {
  const [data, setData] = useState<Inventory>({ items: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");
  const [view, setView] = useState<"inventory" | "history">("inventory");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      const result = await response.json() as Inventory & { error?: string };
      if (!response.ok) throw new Error(result.error || "Inventory could not be loaded.");
      setData(result);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Inventory could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => Promise<unknown> };
    const context = (document as Document & { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(console.error); } catch (error) { console.error(error); } };
    register({ name: "list_office_inventory", title: "List office inventory", description: "Get current item quantities and reorder levels.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async () => { const response = await fetch("/api/inventory", { cache: "no-store" }); if (!response.ok) throw new Error("Could not load inventory"); return response.json(); } });
    register({ name: "set_office_item_count", title: "Set office item count", description: "Set the current stock count of an office item.", inputSchema: { type: "object", properties: { itemId: { type: "integer" }, currentCount: { type: "integer", minimum: 0 }, newCount: { type: "integer", minimum: 0 } }, required: ["itemId", "currentCount", "newCount"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input) => { const value = input as { itemId: number; currentCount: number; newCount: number }; if (!Number.isSafeInteger(value.itemId) || value.itemId < 1 || !Number.isSafeInteger(value.currentCount) || value.currentCount < 0 || !Number.isSafeInteger(value.newCount) || value.newCount < 0) throw new Error("Enter a valid item and count."); const response = await fetch("/api/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "Could not change stock count."); await refresh(); return { ok: true }; } });
    return () => controller.abort();
  }, [refresh]);

  const out = data.items.filter(item => item.quantity === 0).length;
  const low = data.items.filter(item => item.quantity > 0 && item.quantity <= item.reorderAt).length;
  const visible = useMemo(() => data.items.filter(item =>
    (category === "All items" || item.category === category) &&
    (filter === "all" || (filter === "out" ? item.quantity === 0 : item.quantity > 0 && item.quantity <= item.reorderAt)) &&
    item.name.toLowerCase().includes(search.toLowerCase().trim())
  ), [data.items, category, filter, search]);

  function open(next: NonNullable<Modal>) {
    setError("");
    setForm(next.kind === "add" ? emptyForm : { name: next.item.name, category: next.item.category, quantity: next.item.quantity, reorderAt: next.item.reorderAt });
    setModal(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!modal) return;
    setSaving(true); setError("");
    try {
      const isCount = modal.kind === "count";
      const response = await fetch(isCount ? "/api/movements" : "/api/inventory", {
        method: modal.kind === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCount ? { itemId: modal.item.id, currentCount: modal.item.quantity, newCount: form.quantity } : { ...(modal.kind === "edit" ? { id: modal.item.id } : {}), name: form.name, category: form.category, quantity: form.quantity, reorderAt: form.reorderAt }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save this change.");
      setModal(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this change."); }
    finally { setSaving(false); }
  }

  const status = (item: Item) => item.quantity === 0 ? "Out of stock" : item.quantity <= item.reorderAt ? "Reorder now" : "In stock";

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Boxes size={22}/></span><div><strong>Office Stock</strong><small>Inventory control</small></div></div>
      <nav aria-label="Main navigation">
        <button className={view === "inventory" ? "nav active" : "nav"} onClick={() => setView("inventory")}><Boxes size={19}/> Inventory</button>
        <button className={view === "history" ? "nav active" : "nav"} onClick={() => setView("history")}><ClipboardList size={19}/> Activity history</button>
      </nav>
      <div className="sidebar-foot"><span className="status-dot"/> Shared office inventory</div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="mobile-brand"><Boxes size={20}/> Office Stock</div><span className="topbar-label">OFFICE SUPPLIES</span><span className="today">{new Date().toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" })}</span></header>
      <div className="content">
        <div className="heading"><div><p className="eyebrow">STOCK MANAGEMENT</p><h1>{view === "inventory" ? "Inventory" : "Activity history"}</h1><p className="intro">{view === "inventory" ? "Track office kitchen, cleaning and first aid supplies." : "See when stock counts were changed."}</p></div><button className="primary-button" onClick={() => open({kind:"add"})}><PackagePlus size={18}/> Add item</button></div>
        {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X size={16}/></button></div>}
        {view === "inventory" ? <>
          <div className="stats">
            <button className={filter === "all" ? "stat chosen" : "stat"} onClick={() => setFilter("all")}><span className="stat-label">Total items</span><strong>{data.items.length}</strong><span className="stat-foot">All tracked supplies</span></button>
            <button className={filter === "low" ? "stat chosen amber" : "stat amber"} onClick={() => setFilter("low")}><span className="stat-label">Reorder soon</span><strong>{low}</strong><span className="stat-foot">At or below minimum</span></button>
            <button className={filter === "out" ? "stat chosen red" : "stat red"} onClick={() => setFilter("out")}><span className="stat-label">Out of stock</span><strong>{out}</strong><span className="stat-foot">Need to restock</span></button>
          </div>
          <section className="panel"><div className="panel-head"><div><h2>All supplies</h2><p>{visible.length} items shown</p></div><div className="tools"><label className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items" aria-label="Search items"/></label><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter by category">{categories.map(c=><option key={c}>{c}</option>)}</select></div></div>
            <div className="table-wrap"><table><thead><tr><th>ITEM</th><th>CATEGORY</th><th>AVAILABLE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td className="item-name">{item.name}</td><td><span className="category">{item.category}</span></td><td><strong className="count">{item.quantity}</strong></td><td><span className={`badge ${item.quantity === 0 ? "out" : item.quantity <= item.reorderAt ? "low" : "ok"}`}>{status(item)}</span></td><td><div className="row-actions"><button onClick={()=>open({kind:"count",item})} title={`Change ${item.name} count`}><Pencil size={16}/> Change count</button><button className="icon-button" onClick={()=>open({kind:"edit",item})} aria-label={`Edit ${item.name} details`} title="Edit item details"><Pencil size={16}/></button></div></td></tr>)}</tbody></table>{loading && <div className="empty">Loading inventory…</div>}{!loading && visible.length===0 && <div className="empty">No items match this view.</div>}</div>
          </section>
        </> : <section className="panel history-panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Latest 50 stock changes</p></div></div><div className="table-wrap"><table><thead><tr><th>DATE & TIME</th><th>ITEM</th><th>CHANGE</th></tr></thead><tbody>{data.history.map(m=><tr key={m.id}><td className="date">{new Date(m.createdAt.includes("T") ? m.createdAt : m.createdAt.replace(" ", "T") + "Z").toLocaleString("en-LK")}</td><td className="item-name">{m.itemName}</td><td><strong>{m.type === "issued" ? "−" : "+"}{m.quantity}</strong></td></tr>)}</tbody></table>{data.history.length===0 && <div className="empty">No stock activity yet.</div>}</div></section>}
      </div>
    </main>

    {modal && <Dialog open onOpenChange={isOpen => { if (!isOpen && !saving) setModal(null); }}><DialogContent className="modal"><DialogHeader><DialogTitle>{modal.kind === "add" ? "Add new item" : modal.kind === "edit" ? "Edit item" : "Change count"}</DialogTitle><DialogDescription>{modal.kind === "count" ? `Set the available count for ${modal.item.name}.` : "Update the details below."}</DialogDescription></DialogHeader><form onSubmit={submit} className="form">
      {(modal.kind === "add" || modal.kind === "edit") ? <><label>Item name<input required maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="form-grid"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Reorder when count is<input required type="number" min="0" step="1" value={form.reorderAt} onChange={e=>setForm({...form,reorderAt:Number(e.target.value)})}/></label></div>{modal.kind === "add" && <label>Starting count<input required type="number" min="0" step="1" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})}/></label>}</> : <><p className="current-count">Current count: <strong>{modal.item.quantity}</strong></p><label>New count<div className="count-stepper"><button type="button" className="secondary-button" aria-label="Decrease count" disabled={form.quantity <= 0} onClick={()=>setForm({...form,quantity:Math.max(0,form.quantity-1)})}><Minus size={18}/></button><input autoFocus required type="number" min="0" max="2147483647" step="1" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})}/><button type="button" className="secondary-button" aria-label="Increase count" onClick={()=>setForm({...form,quantity:Math.min(2147483647,form.quantity+1)})}><Plus size={18}/></button></div></label></>}
      {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setModal(null)}>Cancel</button><button className="primary-button" disabled={saving || (modal.kind === "count" && form.quantity === modal.item.quantity)}>{saving ? "Saving…" : modal.kind === "count" ? "Save count" : "Save item"}</button></div>
    </form></DialogContent></Dialog>}
  </div>;
}

