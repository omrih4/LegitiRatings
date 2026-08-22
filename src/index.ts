import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Rating, worldsTable } from "./db/schema.ts";
import { Hono } from "@hono/hono";
const server = new Hono();
const PORT = Number(process.env.PORT) || 3000;

const db = drizzle(process.env.DATABASE_URL!);

import { validate as validateUuid } from "uuid";
import { calculateAverage } from "./util.ts";

type PostReviewBody = {
  reviewer: string;
  rating: number;
  review: string;
  description: string;
};

type PostReviewParams = {
  world: string;
};

type GetReviewParams = {
  world: string;
};

type GetReviewResponse = {
  uuid: string;
  description: string;
  ratings: Rating[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
};

server.post("/review/:world", async (c) => {
  const { reviewer, rating, review, description } = await c.req.json();
  if (!validateUuid(c.req.param("world"))) {
    c.status(400);
    return c.json({ error: "Invalid UUID" });
  }
  await db
    .insert(worldsTable)
    .values({
      uuid: c.req.param("world"),
      description,
      ratings: [
        {
          reviewer: reviewer,
          rating: rating,
          review: review,
        },
      ],
    })
    .onConflictDoUpdate({
      target: worldsTable.uuid,
      set: {
        description,
        ratings: sql`
          (
            SELECT COALESCE(jsonb_agg(r), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(${worldsTable.ratings}, '[]'::jsonb)) r 
            WHERE r->>'reviewer' != ${reviewer}
          )
            || excluded.ratings`,
      },
    });
  c.status(201);
  return c.json({ success: true });
});

server.get("/review/:world", async (c) => {
  const world = (
    await db
      .select()
      .from(worldsTable)
      .where(eq(worldsTable.uuid, c.req.param("world")))
  )[0] as Omit<GetReviewResponse, "rating">;
  const response: GetReviewResponse = {
    ...world,
    rating: calculateAverage(world.ratings),
  };
  return c.json(response);
});

server.get("/review", async (c) => {
  try {
    const worlds = await db.select().from(worldsTable);

    const worldsWithAvg = worlds.map((world) => ({
      ...world,
      rating: calculateAverage(world.ratings),
    }));

    return c.json(worldsWithAvg);
  } catch (e: any) {
    c.status(500);
    return c.json({ message: e.message });
  }
});

Deno.serve({ port: PORT, hostname: "0.0.0.0" }, server.fetch);
