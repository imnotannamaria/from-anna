CREATE TABLE "views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"letter_id" uuid NOT NULL,
	"source" text,
	"referrer" text,
	"country" text,
	"device" text,
	"reached_end" boolean DEFAULT false NOT NULL,
	"session_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "views_letter_id_session_id_idx" ON "views" USING btree ("letter_id","session_id");