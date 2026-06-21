-- AlterTable
ALTER TABLE "infrastructure_types" ADD COLUMN "color" TEXT;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN "addrCity" TEXT,
ADD COLUMN "addrHouseNumber" TEXT,
ADD COLUMN "addrPostcode" TEXT,
ADD COLUMN "addrProvince" TEXT,
ADD COLUMN "addrStreet" TEXT;
