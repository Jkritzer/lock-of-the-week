-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'FINAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickResult" AS ENUM ('PENDING', 'WIN', 'LOSS', 'PUSH');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "oddsEventId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "commenceTime" TIMESTAMP(3) NOT NULL,
    "homeSpread" DOUBLE PRECISION,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "pickedTeam" TEXT NOT NULL,
    "spreadAtPick" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "PickResult" NOT NULL DEFAULT 'PENDING',
    "coverMargin" DOUBLE PRECISION,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_name_key" ON "Participant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Week_seasonYear_weekNumber_key" ON "Week"("seasonYear", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Game_oddsEventId_key" ON "Game"("oddsEventId");

-- CreateIndex
CREATE INDEX "Game_weekId_idx" ON "Game"("weekId");

-- CreateIndex
CREATE INDEX "Pick_gameId_idx" ON "Pick"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_participantId_weekId_key" ON "Pick"("participantId", "weekId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
