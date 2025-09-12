-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "statusCode" INTEGER,
ADD COLUMN     "url" TEXT;
