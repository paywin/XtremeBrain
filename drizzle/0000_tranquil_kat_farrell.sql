CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`created_at` text NOT NULL,
	`answers` text NOT NULL,
	`result` text NOT NULL,
	`seconds` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attempts_user_date` ON `attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target` text NOT NULL,
	`minutes` integer DEFAULT 60 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_user` ON `tasks` (`user_id`);