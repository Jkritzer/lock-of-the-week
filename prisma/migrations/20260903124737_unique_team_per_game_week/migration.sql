-- DropIndex
DROP INDEX "Pick_weekId_gameId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Pick_weekId_gameId_pickedTeam_key" ON "Pick"("weekId", "gameId", "pickedTeam");
