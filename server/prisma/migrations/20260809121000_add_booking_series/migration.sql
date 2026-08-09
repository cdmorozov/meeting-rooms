ALTER TABLE "bookings" ADD COLUMN "series_id" UUID;

CREATE INDEX "bookings_series_id_idx" ON "bookings" ("series_id");
