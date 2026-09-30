import { ensureSchema, errorResponse, getDb, positiveInt } from "@/lib/inventory";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { itemId?: number; currentCount?: number; newCount?: number };
    const itemId = positiveInt(body.itemId);
    const currentCount = body.currentCount;
    const newCount = body.newCount;
    if (!itemId || !Number.isSafeInteger(currentCount) || !Number.isSafeInteger(newCount) ||
        currentCount! < 0 || newCount! < 0 || currentCount! > 2147483647 || newCount! > 2147483647) {
      return Response.json({ error: "Enter a valid stock count." }, { status: 400 });
    }
    if (newCount === currentCount) return Response.json({ ok: true });

    await ensureSchema();
    const type = newCount! > currentCount! ? "received" : "issued";
    const change = Math.abs(newCount! - currentCount!);
    const result = await getDb()`
      WITH updated AS (
        UPDATE items SET quantity = ${newCount}
        WHERE id = ${itemId} AND quantity = ${currentCount}
        RETURNING id
      )
      INSERT INTO movements (item_id, type, quantity, person, note)
      SELECT id, ${type}, ${change}, '', '' FROM updated
      RETURNING id
    `;
    if (!result.length) return Response.json({ error: "Count changed on another device. Close this window and try again." }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

