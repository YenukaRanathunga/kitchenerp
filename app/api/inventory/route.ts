import { ensureSchema, errorResponse, getDb, positiveInt } from "@/lib/inventory";

export async function GET() {
  try {
    await ensureSchema();
    const sql = getDb();
    const [items, history] = await Promise.all([
      sql`SELECT id, name, category, quantity, reorder_at AS "reorderAt" FROM items ORDER BY LOWER(name)`,
      sql`SELECT m.id, m.item_id AS "itemId", i.name AS "itemName", m.type, m.quantity, m.created_at AS "createdAt" FROM movements m JOIN items i ON i.id = m.item_id ORDER BY m.id DESC LIMIT 50`,
    ]);
    return Response.json({ items, history });
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
    await ensureSchema();
    const sql = getDb();
    const inserted = await sql`INSERT INTO items (name, category, quantity, reorder_at) VALUES (${name}, ${category}, ${quantity}, ${reorderAt}) RETURNING id`;
    if (quantity > 0) await sql`INSERT INTO movements (item_id, type, quantity) VALUES (${inserted[0].id}, 'received', ${quantity})`;
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "An item with this name already exists." }, { status: 409 });
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
    await ensureSchema();
    const result = await getDb()`UPDATE items SET name = ${name}, category = ${category}, reorder_at = ${reorderAt} WHERE id = ${id} RETURNING id`;
    if (!result.length) return Response.json({ error: "Item not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "An item with this name already exists." }, { status: 409 });
    return errorResponse(error);
  }
}

