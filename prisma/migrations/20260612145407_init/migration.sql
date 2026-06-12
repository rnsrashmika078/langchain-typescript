-- CreateTable
CREATE TABLE "Threads" (
    "id" SERIAL NOT NULL,
    "thread_id" TEXT NOT NULL,

    CONSTRAINT "Threads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Threads_thread_id_key" ON "Threads"("thread_id");
