import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 32 }).primaryKey(),
  username: varchar('username', { length: 24 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdBy: varchar('created_by', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  isDeleted: boolean('is_deleted').notNull().default(false),
});
