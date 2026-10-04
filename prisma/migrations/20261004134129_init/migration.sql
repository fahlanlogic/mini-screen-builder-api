-- CreateTable
CREATE TABLE "Screen" (
    "id" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "elements" JSONB NOT NULL DEFAULT '[]',
    "publishedVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedScreen" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "elements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedScreen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublishedScreen_screenId_version_key" ON "PublishedScreen"("screenId", "version");

-- AddForeignKey
ALTER TABLE "PublishedScreen" ADD CONSTRAINT "PublishedScreen_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
