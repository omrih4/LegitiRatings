import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Rating, worldsTable } from "./db/schema.js";
import fastify from "fastify";
const server = fastify();
const PORT = Number(process.env.PORT) || 3000;

const db = drizzle(process.env.DATABASE_URL!);

import { validate as validateUuid } from "uuid";
import { calculateAverage } from "./util.js";

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

server.post<{ Body: PostReviewBody; Params: PostReviewParams }>(
  "/review/:world",
  async (req, res) => {
    const { reviewer, rating, review, description } = req.body;
    if (!validateUuid(req.params.world)) {
      return res.code(400).send({ error: "Invalid UUID" });
    }
    await db
      .insert(worldsTable)
      .values({
        uuid: req.params.world,
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
    return res.code(201).send({ success: true });
  },
);

server.get<{ Params: GetReviewParams }>("/review/:world", async (req, res) => {
  const world = (
    await db
      .select()
      .from(worldsTable)
      .where(eq(worldsTable.uuid, req.params.world))
  )[0] as Omit<GetReviewResponse, "rating">;
  const response: GetReviewResponse = {
    ...world,
    rating: calculateAverage(world.ratings),
  };
  return response;
});

server.get<{ Params: GetReviewParams }>("/review", async (req, res) => {
  try {
    const worlds = await db.select().from(worldsTable);

    const worldsWithAvg = worlds.map((world) => ({
      ...world,
      rating: calculateAverage(world.ratings),
    }));

    res.code(200).send(worldsWithAvg);
  } catch (e: any) {
    res.code(400).send({ message: e.message });
  }
});

server.listen({ port: PORT, host: "0.0.0.0" }, () => {
  console.log(`listening on port ${PORT}`);
});
