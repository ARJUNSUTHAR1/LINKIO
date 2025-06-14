-- CreateTable
CREATE TABLE "User" (
    "_id" TEXT NOT NULL,
    "clerkId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "defaultWorkspace" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "Link" (
    "_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "expiredUrl" TEXT,
    "password" TEXT,
    "externalId" TEXT,
    "proxy" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "userId" TEXT,
    "publicStats" BOOLEAN NOT NULL DEFAULT false,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastClicked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "LinkTag" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "linkId" TEXT,

    CONSTRAINT "LinkTag_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_source_idx" ON "User"("source");

-- CreateIndex
CREATE INDEX "User_defaultWorkspace_idx" ON "User"("defaultWorkspace");

-- CreateIndex
CREATE INDEX "LinkTag_projectId_idx" ON "LinkTag"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkTag_name_projectId_key" ON "LinkTag"("name", "projectId");
