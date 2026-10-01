import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {userId:text('user_id').primaryKey(), name:text('name').notNull(), target:text('target').notNull(), minutes:integer('minutes').notNull().default(60)});
export const attempts = sqliteTable('attempts', {id:text('id').primaryKey(),userId:text('user_id').notNull(),examId:text('exam_id').notNull(),createdAt:text('created_at').notNull(),answers:text('answers').notNull(),result:text('result').notNull(),seconds:integer('seconds').notNull()},t=>[index('attempts_user_date').on(t.userId,t.createdAt)]);
export const drafts = sqliteTable('drafts', {userId:text('user_id').primaryKey(),payload:text('payload').notNull()});
export const tasks = sqliteTable('tasks', {id:text('id').primaryKey(),userId:text('user_id').notNull(),topic:text('topic').notNull(),completedAt:text('completed_at').notNull()},t=>[index('tasks_user').on(t.userId)]);
// Community migrations are authored in drizzle/0002_community.sql.
export const socialProfiles = sqliteTable('social_profiles', {userId:text('user_id').primaryKey(),friendCode:text('friend_code').notNull().unique(),shareActivity:integer('share_activity').notNull().default(0)});

export const friendships = sqliteTable('friendships',{userA:text('user_a').notNull(),userB:text('user_b').notNull(),requester:text('requester').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()},t=>[primaryKey({columns:[t.userA,t.userB]}),index('friendships_b').on(t.userB,t.status)]);
export const studyPresence = sqliteTable('study_presence',{userId:text('user_id').primaryKey(),lastPing:integer('last_ping').notNull()});
export const studyDays = sqliteTable('study_days',{userId:text('user_id').notNull(),day:text('day').notNull(),seconds:integer('seconds').notNull().default(0)},t=>[primaryKey({columns:[t.userId,t.day]})]);
export const earnedBadges = sqliteTable('earned_badges',{userId:text('user_id').notNull(),badgeId:text('badge_id').notNull(),earnedAt:text('earned_at').notNull()},t=>[primaryKey({columns:[t.userId,t.badgeId]})]);
