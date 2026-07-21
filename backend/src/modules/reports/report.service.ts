import { prisma } from "../../lib/prisma";

function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function upsertSum(map: Map<string, any>, key: string, amount: number, extra: Record<string, unknown> = {}) {
  const current = map.get(key) ?? { key, amount: 0, count: 0, ...extra };
  current.amount = round(current.amount + amount);
  current.count += 1;
  map.set(key, current);
}

export async function getReportsSummary(organizationId: string) {
  const [suppliers, items, orders, supportTickets] = await Promise.all([
    prisma.supplier.count({ where: { organizationId, isActive: true } }),
    prisma.item.count({ where: { organizationId, isActive: true } }),
    prisma.purchaseOrder.findMany({
      where: { supplier: { organizationId } },
      include: {
        supplier: { select: { id: true, name: true, category: true } },
        lines: {
          include: {
            item: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { issueDate: "desc" },
    }),
    prisma.supportTicket.count({
      where: { organizationId, status: { in: ["ABIERTO", "EN_REVISION"] } },
    }),
  ]);

  const totalSpend = round(orders.reduce((sum, order) => sum + Number(order.total), 0));
  const subtotal = round(orders.reduce((sum, order) => sum + Number(order.subtotal), 0));
  const tax = round(orders.reduce((sum, order) => sum + Number(order.tax), 0));
  const averageOrder = orders.length ? round(totalSpend / orders.length) : 0;

  const bySupplier = new Map<string, any>();
  const byCategory = new Map<string, any>();
  const byMonth = new Map<string, any>();
  const byStatus = new Map<string, any>();

  for (const order of orders) {
    upsertSum(bySupplier, order.supplierId, Number(order.total), {
      supplierId: order.supplierId,
      supplierName: order.supplier.name,
    });
    upsertSum(byMonth, monthKey(order.issueDate), Number(order.total), {
      month: monthKey(order.issueDate),
    });
    upsertSum(byStatus, order.status, Number(order.total), {
      status: order.status,
    });

    for (const line of order.lines) {
      const categoryName = line.item.category?.name || order.supplier.category || "Sin categoría";
      upsertSum(byCategory, categoryName, Number(line.lineTotal), {
        category: categoryName,
      });
    }
  }

  return {
    overview: {
      suppliers,
      items,
      orders: orders.length,
      supportTickets,
      subtotal,
      tax,
      totalSpend,
      averageOrder,
      currency: orders[0]?.currency ?? "DOP",
    },
    spendingBySupplier: Array.from(bySupplier.values()).sort((a, b) => b.amount - a.amount),
    spendingByCategory: Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount),
    spendingByMonth: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
    spendingByStatus: Array.from(byStatus.values()).sort((a, b) => b.amount - a.amount),
    recentOrders: orders.slice(0, 5).map((order) => ({
      id: order.id,
      number: order.number,
      supplierName: order.supplier.name,
      status: order.status,
      issueDate: order.issueDate,
      total: order.total.toString(),
      currency: order.currency,
    })),
  };
}
