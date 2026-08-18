CREATE TABLE "car_masters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maker" text NOT NULL,
	"model" text NOT NULL,
	"generation" text,
	"year_from" integer,
	"year_to" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "car_masters_maker_model_unique" UNIQUE("maker","model")
);
--> statement-breakpoint
CREATE TABLE "user_cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"car_master_id" uuid NOT NULL,
	"nickname" text,
	"year" text,
	"mileage" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"prefecture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_car_master_id_car_masters_id_fk" FOREIGN KEY ("car_master_id") REFERENCES "public"."car_masters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "car_masters_maker_idx" ON "car_masters" USING btree ("maker");--> statement-breakpoint
CREATE INDEX "user_cars_user_id_idx" ON "user_cars" USING btree ("user_id");