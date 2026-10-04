ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "name" TEXT, ADD COLUMN "username" TEXT;
UPDATE "User" SET "name" = COALESCE(split_part("email", '@', 1), 'Исследователь'), "username" = 'user_' || "id";
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL, ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
