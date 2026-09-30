import { errorResponse, getDb, initialItems, positiveInt } from "@/lib/inventory";

export async function GET() {
  try {
    const db = getDb();
    const existing = await db.prepare("SELECT COUNT(*) AS count FROM items").first<{ count: number }>();
    if (existing?.count === 0) await db.batch(initialItems.map(([name, category]) => db.prepare("INSERT OR IGNORE INTO items (name, category, quantity, reorder_at) VALUES (?, ?, 0, 1)").bind(name, category)));
    const items = await db.prepare("SELECT id, name, category, quantity, reorder_at AS reorderAt FROM items ORDER BY name COLLATE NOCASE").all();
    const history = await db.prepare("SELECT m.id, m.item_id AS itemId, i.name AS itemName, m.type, m.quantity, m.person, m.note, m.created_at AS createdAt FROM movements m JOIN items i ON i.id = m.item_id ORDER BY m.id DESC LIMIT 50").all();
    return Response.json({ items: items.results, history: history.results });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; category?: string; quantity?: number; reorderAt?: number };
    const name = body.name?.trim() ?? "";
    const category = body.category?.trim() || "Other";
    const quantity = Number(body.quantity ?? 0);
    const reorderAt = Number(body.reorderAt ?? 1);
    if (!name || name.length > 120 || !Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(reorderAt) || reorderAt < 0) return Response.json({ error: "Enter a valid item name and stock count." }, { status: 400 });
    const db = getDb();
    const insert = db.prepare("INSERT INTO items (name, category, quantity, reorder_at) VALUES (?, ?, ?, ?)").bind(name, category, quantity, reorderAt);
    if (quantity > 0) await db.batch([insert, db.prepare("INSERT INTO movements (item_id, type, quantity, person, note) SELECT id, 'received', ?, 'Initial stock', '' FROM items WHERE name = ?").bind(quantity, name)]);
    else await insert.run();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint")) return Response.json({ error: "An item with this name already exists." }, { status: 409 });
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: number; name?: string; category?: string; reorderAt?: number };
    const id = positiveInt(body.id);
    const name = body.name?.trim() ?? "";
    const category = body.category?.trim() || "Other";
    const reorderAt = Number(body.reorderAt);
    if (!id || !name || name.length > 120 || !Number.isSafeInteger(reorderAt) || reorderAt < 0) return Response.json({ error: "Enter valid item details." }, { status: 400 });
    const result = await getDb().prepare("UPDATE items SET name = ?, category = ?, reorder_at = ? WHERE id = ?").bind(name, category, reorderAt, id).run();
    if (!result.meta.changes) return Response.json({ error: "Item not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint")) return Response.json({ error: "An item with this name already exists." }, { status: 409 });
    return errorResponse(error);
  }
}
