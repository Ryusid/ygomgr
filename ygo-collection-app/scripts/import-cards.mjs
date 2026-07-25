import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env variables");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

const API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

function chunkArray(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

async function main() {
  console.log("Downloading cards from YGOPRODeck...");

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`YGOPRODeck request failed: ${response.status}`);
  }

  const json = await response.json();

  const rows = json.data.map((card) => {
    const image = card.card_images?.[0];

    return {
      id: card.id,
      name: card.name,
      type: card.type ?? null,
      description: card.desc ?? null,
      frame_type: card.frameType ?? null,
      race: card.race ?? null,
      attribute: card.attribute ?? null,
      archetype: card.archetype ?? null,
      atk: card.atk ?? null,
      def: card.def ?? null,
      level: card.level ?? null,
      linkval: card.linkval ?? null,
      scale: card.scale ?? null,
      image_url: image?.image_url_small ?? image?.image_url ?? null,
      raw_json: card,
      updated_at: new Date().toISOString(),
   };
  });

  console.log(`Preparing to import ${rows.length} cards...`);

  const chunks = chunkArray(rows, 500);

  for (const [index, chunk] of chunks.entries()) {
    const { error } = await supabase
      .from("cards")
      .upsert(chunk, { onConflict: "id" });

    if (error) {
      console.error(error);
      throw new Error(`Failed on chunk ${index + 1}`);
    }

    console.log(`Imported chunk ${index + 1}/${chunks.length}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
