CREATE INDEX "buyers_updated_at_idx" ON "buyers" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "buyers_phone_idx" ON "buyers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "buyers_name_idx" ON "buyers" USING btree ("full_name");