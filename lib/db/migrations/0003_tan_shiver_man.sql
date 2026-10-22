CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"letter_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_letter_session_reaction_idx" ON "reactions" USING btree ("letter_id","session_id","reaction");