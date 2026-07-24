import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  createItemSchema,
  createNamedEntitySchema,
  createUnitSchema,
  itemIdParamsSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from "./catalog.schema";
import {
  createBrand,
  createCategory,
  createItem,
  createUnit,
  deactivateItem,
  getItemDetail,
  listBrands,
  listCategories,
  listItems,
  listTags,
  listUnits,
  updateItem,
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
export const brandRouter = Router();
export const tagRouter = Router();
export const unitRouter = Router();

itemRouter.use(authenticate);
categoryRouter.use(authenticate);
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

itemRouter.post("/", validate({ body: createItemSchema }), async (req, res, next) => {
  try {
    const item = await createItem(organizationId(req), createItemSchema.parse(req.body));
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

itemRouter.put("/:id", validate({ params: itemIdParamsSchema, body: updateItemSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    const item = await updateItem(organizationId(req), id, updateItemSchema.parse(req.body));
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

itemRouter.delete("/:id", validate({ params: itemIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = itemIdParamsSchema.parse(req.params);
    await deactivateItem(organizationId(req), id);
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

categoryRouter.post("/", validate({ body: createNamedEntitySchema }), async (req, res, next) => {
  try {
    const category = await createCategory(organizationId(req), createNamedEntitySchema.parse(req.body));
    res.status(201).json({ category });
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

brandRouter.post("/", validate({ body: createNamedEntitySchema }), async (req, res, next) => {
  try {
    const brand = await createBrand(organizationId(req), createNamedEntitySchema.parse(req.body));
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

unitRouter.post("/", validate({ body: createUnitSchema }), async (req, res, next) => {
  try {
    const unit = await createUnit(organizationId(req), createUnitSchema.parse(req.body));
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
