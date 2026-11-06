import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const events = sqliteTable('learning_events', {
 id: text('id').primaryKey(), profile: text('profile').notNull(), kind: text('kind').notNull(),
 data: text('data').notNull(), at: text('at').notNull()
});
