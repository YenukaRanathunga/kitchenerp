import { errorResponse, getDb, positiveInt } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { itemId?: number; type?: string; quantity?: number; person?: string; note?: string };
    const itemId = positiveInt(body.itemId);
    const quantity = positiveInt(body.quantity);
    const type = body.type;
    const person = body.person?.trim() ?? "";
    const note = body.note?.trim() ?? "";
    if (!itemId || !quantity || !["issued", "received"].includes(type ?? "") || !person || person.length > 80 || note.length > 200) return Response.json({ error: "Enter a valid quantity and person." }, { status: 400 });
    const db = getDb();
    const change = type === "issued" ? -quantity : quantity;
    const results = await db.batch([
      db.prepare("UPDATE items SET quantity = quantity + ? WHERE id = ? AND quantity + ? >= 0").bind(change, itemId, change),
      db.prepare("INSERT INTO movements (item_id, type, quantity, person, note) SELECT ?, ?, ?, ?, ? WHERE changes() = 1").bind(itemId, type, quantity, person, note),
    ]);
    if (!results[0].meta.changes) return Response.json({ error: "Item not found or not enough stock available." }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
