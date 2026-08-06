import { Router } from "express";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  createItemSchema,
  createNamedEntitySchema,
  createSubcategorySchema,
  createUnitSchema,
  itemIdParamsSchema,
  listItemsQuerySchema,
  listSubcategoriesQuerySchema,
  updateItemSchema,
} from "./catalog.schema";
import {
  createBrand,
  createCategory,
  createItem,
  createSubcategory,
  createUnit,
  deactivateItem,
  getItemDetail,
  listBrands,
  listCategories,
  listItems,
  listSubcategories,
  listTags,
  listUnits,
  updateItem,
  restoreItem,
} from "./catalog.service";

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

export const itemRouter = Router();
export const categoryRouter = Router();
export const subcategoryRouter = Router();
export const brandRouter = Router();
export const tagRouter = Router();
export const unitRouter = Router();

itemRouter.use(authenticate);
categoryRouter.use(authenticate);
subcategoryRouter.use(authenticate);
brandRouter.use(authenticate);
tagRouter.use(authenticate);
unitRouter.use(authenticate);

itemRouter.get("/", validate({ query: listItemsQuerySchema }), async (req, res, next) => {
  try {
    const items = await listItems(organizationId(req), listItemsQuerySchema.parse(req.query));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

itemRouter.get("/:id", validate({ params: itemIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    const detail = await getItemDetail(organizationId(req), id);
    res.json(detail);
  } catch (error) {
    next(error);
  }
});

itemRouter.post("/", requirePermission("catalog:write"), validate({ body: createItemSchema }), async (req, res, next) => {
  try {
    const item = await createItem(organizationId(req), req.user!.id, createItemSchema.parse(req.body));
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

itemRouter.put("/:id", requirePermission("catalog:write"), validate({ params: itemIdParamsSchema, body: updateItemSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    const item = await updateItem(organizationId(req), req.user!.id, id, updateItemSchema.parse(req.body));
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

itemRouter.delete("/:id", requirePermission("catalog:write"), validate({ params: itemIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    await deactivateItem(organizationId(req), req.user!.id, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

itemRouter.post("/:id/restore", requirePermission("catalog:write"), validate({ params: itemIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    await restoreItem(organizationId(req), req.user!.id, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

categoryRouter.get("/", async (req, res, next) => {
  try {
    res.json({ categories: await listCategories(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

categoryRouter.post("/", requirePermission("catalog:write"), validate({ body: createNamedEntitySchema }), async (req, res, next) => {
  try {
    const category = await createCategory(organizationId(req), req.user!.id, createNamedEntitySchema.parse(req.body));
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

subcategoryRouter.get("/", validate({ query: listSubcategoriesQuerySchema }), async (req, res, next) => {
  try {
    res.json({ subcategories: await listSubcategories(organizationId(req), listSubcategoriesQuerySchema.parse(req.query)) });
  } catch (error) {
    next(error);
  }
});

subcategoryRouter.post("/", requirePermission("catalog:write"), validate({ body: createSubcategorySchema }), async (req, res, next) => {
  try {
    const subcategory = await createSubcategory(organizationId(req), req.user!.id, createSubcategorySchema.parse(req.body));
    res.status(201).json({ subcategory });
  } catch (error) {
    next(error);
  }
});

brandRouter.get("/", async (req, res, next) => {
  try {
    res.json({ brands: await listBrands(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

brandRouter.post("/", requirePermission("catalog:write"), validate({ body: createNamedEntitySchema }), async (req, res, next) => {
  try {
    const brand = await createBrand(organizationId(req), req.user!.id, createNamedEntitySchema.parse(req.body));
    res.status(201).json({ brand });
  } catch (error) {
    next(error);
  }
});

unitRouter.get("/", async (req, res, next) => {
  try {
    res.json({ units: await listUnits(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

unitRouter.post("/", requirePermission("catalog:write"), validate({ body: createUnitSchema }), async (req, res, next) => {
  try {
    const unit = await createUnit(organizationId(req), req.user!.id, createUnitSchema.parse(req.body));
    res.status(201).json({ unit });
  } catch (error) {
    next(error);
  }
});

tagRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ tags: await listTags() });
  } catch (error) {
    next(error);
  }
});
