import { env } from "cloudflare:workers";

export const initialItems: [string, string][] = [
  ["UHT Milk 1L", "Kitchen"], ["Milk Powder 1Kg", "Kitchen"], ["Brown Sugar 1Kg", "Kitchen"],
  ["Ginger Tea (20 Tea Bags)", "Kitchen"], ["Nescafe 200g", "Kitchen"], ["Black Tea (50 Tea Bags)", "Kitchen"],
  ["Normal Green Tea (20 Tea Bags)", "Kitchen"], ["Mint Tea (20 Tea Bags)", "Kitchen"], ["Cinnamon Tea (20 Tea Bags)", "Kitchen"],
  ["Facial Tissue Boxes 100s", "Cleaning"], ["Sponge", "Cleaning"], ["Air Freshener Cinnamon 500ml", "Cleaning"],
  ["Harpic", "Cleaning"], ["Toilet Paper Roll", "Cleaning"], ["Vim Liquid - 500ml", "Cleaning"],
  ["Collin", "Cleaning"], ["Lysol Pine 950ML", "Cleaning"], ["Pynol", "Cleaning"],
  ["Harischandra Coffee 200g", "Kitchen"], ["Hand Sanitizer 500 ML", "Cleaning"],
  ["Vitamin C 500Mg", "Medical"], ["Omeprazole 20Mg", "Medical"], ["Samahan 4g", "Medical"],
  ["Sanitary Napkins (16 units)", "Medical"], ["Garbage Bags XXXL", "Cleaning"],
  ["AA Batteries", "Other"], ["AAA Batteries", "Other"], ["Mefen 500mg Tablets", "Medical"],
  ["Diagene Cards", "Medical"], ["Eno Sachets", "Medical"], ["Panadol Box", "Medical"],
  ["Jeewani Sachets", "Medical"], ["Head Fast Idoex", "Medical"], ["Idoex", "Medical"],
  ["Siddhalepa", "Medical"], ["Morteen Coil", "Cleaning"], ["Hand Wash Refill Pack", "Cleaning"],
  ["Dettol 750ML", "Cleaning"],
];

export function getDb() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("Inventory database is unavailable.");
  return db;
}

export function errorResponse(error: unknown) {
  console.error(error);
  return Response.json({ error: "Could not save inventory right now. Please try again." }, { status: 500 });
}

export function positiveInt(value: unknown) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
