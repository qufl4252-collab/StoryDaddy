CREATE TABLE `anonymous_users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`anonymous_user_id` text NOT NULL,
	`feature` text NOT NULL,
	`title` text NOT NULL,
	`theme` text NOT NULL,
	`content_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`anonymous_user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`theme` text,
	`created_at` integer NOT NULL
);
