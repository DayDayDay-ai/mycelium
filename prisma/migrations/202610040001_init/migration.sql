-- CreateEnum
CREATE TYPE "Edibility" AS ENUM ('EDIBLE', 'CONDITIONAL', 'INEDIBLE', 'POISONOUS', 'DEADLY');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('ALLOWED', 'FORBIDDEN', 'REGIONAL');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'STUDIED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Mushroom" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameLatin" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "edibility" "Edibility" NOT NULL,
    "toxicityLevel" TEXT NOT NULL DEFAULT 'Требует проверки',
    "collectionStatus" "CollectionStatus" NOT NULL DEFAULT 'REGIONAL',
    "protectionStatus" TEXT NOT NULL DEFAULT 'Требуется проверка по региону',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "capDescription" TEXT NOT NULL,
    "stemDescription" TEXT NOT NULL,
    "hymenophoreDescription" TEXT NOT NULL,
    "fleshDescription" TEXT NOT NULL DEFAULT 'Требует проверки',
    "smellDescription" TEXT NOT NULL DEFAULT 'Не используйте запах или вкус для проверки безопасности',
    "sizeDescription" TEXT NOT NULL DEFAULT 'Требует проверки',
    "damageReaction" TEXT NOT NULL DEFAULT 'Требует проверки',
    "habitat" TEXT[],
    "associatedTrees" TEXT[],
    "seasonMonths" INTEGER[],
    "warning" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "model3dUrl" TEXT,
    "modelColor" TEXT NOT NULL DEFAULT '#a67c52',
    "modelShape" TEXT NOT NULL DEFAULT 'bolete',
    "sourceUrl" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mushroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MushroomImage" (
    "id" TEXT NOT NULL,
    "mushroomId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,

    CONSTRAINT "MushroomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MushroomRegion" (
    "id" TEXT NOT NULL,
    "mushroomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "MushroomRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MushroomLookalike" (
    "id" TEXT NOT NULL,
    "mushroomId" TEXT NOT NULL,
    "similarId" TEXT NOT NULL,
    "differences" TEXT NOT NULL,
    "risk" TEXT NOT NULL,

    CONSTRAINT "MushroomLookalike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMushroomProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mushroomId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studiedAt" TIMESTAMP(3),

    CONSTRAINT "UserMushroomProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mushroom_slug_key" ON "Mushroom"("slug");

-- CreateIndex
CREATE INDEX "Mushroom_isPublished_edibility_collectionStatus_idx" ON "Mushroom"("isPublished", "edibility", "collectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MushroomLookalike_mushroomId_similarId_key" ON "MushroomLookalike"("mushroomId", "similarId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMushroomProgress_userId_mushroomId_key" ON "UserMushroomProgress"("userId", "mushroomId");

-- AddForeignKey
ALTER TABLE "MushroomImage" ADD CONSTRAINT "MushroomImage_mushroomId_fkey" FOREIGN KEY ("mushroomId") REFERENCES "Mushroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MushroomRegion" ADD CONSTRAINT "MushroomRegion_mushroomId_fkey" FOREIGN KEY ("mushroomId") REFERENCES "Mushroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MushroomLookalike" ADD CONSTRAINT "MushroomLookalike_mushroomId_fkey" FOREIGN KEY ("mushroomId") REFERENCES "Mushroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MushroomLookalike" ADD CONSTRAINT "MushroomLookalike_similarId_fkey" FOREIGN KEY ("similarId") REFERENCES "Mushroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMushroomProgress" ADD CONSTRAINT "UserMushroomProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMushroomProgress" ADD CONSTRAINT "UserMushroomProgress_mushroomId_fkey" FOREIGN KEY ("mushroomId") REFERENCES "Mushroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
