CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_path` text NOT NULL,
	`name` text DEFAULT 'New chat' NOT NULL,
	`session_id` text,
	`model` text,
	`messages` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_chats_workspace_updated` ON `chats` (`workspace_path`,`updated_at`);