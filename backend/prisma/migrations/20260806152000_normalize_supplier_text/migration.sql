UPDATE "Supplier"
SET
  "name" = UPPER("name"),
  "rnc" = UPPER("rnc"),
  "city" = UPPER("city"),
  "address" = UPPER("address"),
  "phone" = UPPER("phone"),
  "whatsapp" = UPPER("whatsapp"),
  "email" = UPPER("email"),
  "website" = UPPER("website"),
  "instagram" = UPPER("instagram"),
  "facebook" = UPPER("facebook"),
  "notes" = UPPER("notes");

UPDATE "Contact"
SET
  "name" = UPPER("name"),
  "role" = UPPER("role"),
  "phone" = UPPER("phone"),
  "whatsapp" = UPPER("whatsapp"),
  "email" = UPPER("email");

UPDATE "Tag" SET "name" = UPPER("name");
