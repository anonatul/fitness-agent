-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('STRENGTH', 'RUN', 'RECOVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('EASY', 'QUALITY', 'LONG', 'RECOVERY', 'OTHER');

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "sex" TEXT,
    "heightCm" DOUBLE PRECISION,
    "currentWeightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "restingHr" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "perceivedEffort" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthExercise" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variation" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrengthExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthSet" (
    "id" TEXT NOT NULL,
    "strengthExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "rir" INTEGER,
    "loadKg" DOUBLE PRECISION,
    "assistanceKg" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrengthSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "averagePaceSecondsPerKm" INTEGER,
    "averageHr" INTEGER,
    "perceivedEffort" INTEGER,
    "runType" "RunType" NOT NULL DEFAULT 'OTHER',
    "elevationGainM" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryLog" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "energyScore" INTEGER,
    "sorenessScore" INTEGER,
    "motivationScore" INTEGER,
    "restingHr" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMetric" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "restingHr" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_athleteId_status_idx" ON "Goal"("athleteId", "status");

-- CreateIndex
CREATE INDEX "Goal_athleteId_priority_idx" ON "Goal"("athleteId", "priority");

-- CreateIndex
CREATE INDEX "TrainingSession_athleteId_sessionDate_idx" ON "TrainingSession"("athleteId", "sessionDate");

-- CreateIndex
CREATE INDEX "TrainingSession_athleteId_sessionType_sessionDate_idx" ON "TrainingSession"("athleteId", "sessionType", "sessionDate");

-- CreateIndex
CREATE INDEX "StrengthExercise_trainingSessionId_idx" ON "StrengthExercise"("trainingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StrengthExercise_trainingSessionId_orderIndex_key" ON "StrengthExercise"("trainingSessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "StrengthSet_strengthExerciseId_idx" ON "StrengthSet"("strengthExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "StrengthSet_strengthExerciseId_setNumber_key" ON "StrengthSet"("strengthExerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Run_trainingSessionId_key" ON "Run"("trainingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryLog_athleteId_date_key" ON "RecoveryLog"("athleteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BodyMetric_athleteId_date_key" ON "BodyMetric"("athleteId", "date");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthExercise" ADD CONSTRAINT "StrengthExercise_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthSet" ADD CONSTRAINT "StrengthSet_strengthExerciseId_fkey" FOREIGN KEY ("strengthExerciseId") REFERENCES "StrengthExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryLog" ADD CONSTRAINT "RecoveryLog_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMetric" ADD CONSTRAINT "BodyMetric_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
