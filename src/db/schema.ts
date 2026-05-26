import {
  integer,
  pgTable,
  varchar,
  uuid,
  timestamp,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export type Rating = {
  reviewer: string;
  rating: number;
  review: string;
};

export const worldsTable = pgTable("worlds", {
  uuid: uuid().primaryKey(),

  description: text().notNull(),

  ratings: jsonb("ratings").$type<Rating[]>().notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
