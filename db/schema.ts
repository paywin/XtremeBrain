import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {userId:text('user_id').primaryKey(), name:text('name').notNull(), target:text('target').notNull(), minutes:integer('minutes').notNull().default(60)});
export const attempts = sqliteTable('attempts', {id:text('id').primaryKey(),userId:text('user_id').notNull(),examId:text('exam_id').notNull(),createdAt:text('created_at').notNull(),answers:text('answers').notNull(),result:text('result').notNull(),seconds:integer('seconds').notNull()},t=>[index('attempts_user_date').on(t.userId,t.createdAt)]);
export const drafts = sqliteTable('drafts', {userId:text('user_id').primaryKey(),payload:text('payload').notNull()});
export const tasks = sqliteTable('tasks', {id:text('id').primaryKey(),userId:text('user_id').notNull(),topic:text('topic').notNull(),completedAt:text('completed_at').notNull()},t=>[index('tasks_user').on(t.userId)]);
