import { ensureSchema, errorResponse, getDb, positiveInt } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { itemId?: number; type?: string; quantity?: number; person?: string; note?: string };
    const itemId = positiveInt(body.itemId);
    const quantity = positiveInt(body.quantity);
    const type = body.type;
    const person = body.person?.trim() ?? "";
    const note = body.note?.trim() ?? "";
    if (!itemId || !quantity || !["issued", "received"].includes(type ?? "") || !person || person.length > 80 || note.length > 200) return Response.json({ error: "Enter a valid quantity and person." }, { status: 400 });
    await ensureSchema();
    const sql = getDb();
    const change = type === "issued" ? -quantity : quantity;
    const result = await sql`
      WITH updated AS (
        UPDATE items SET quantity = quantity + ${change}
        WHERE id = ${itemId} AND quantity + ${change} >= 0
        RETURNING id
      )
      INSERT INTO movements (item_id, type, quantity, person, note)
      SELECT id, ${type}, ${quantity}, ${person}, ${note} FROM updated
      RETURNING id
    `;
    if (!result.length) return Response.json({ error: "Item not found or not enough stock available." }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
