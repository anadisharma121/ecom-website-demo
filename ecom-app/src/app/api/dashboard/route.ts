import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/dashboard - Admin dashboard stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalProducts, totalUsers, totalOrders, totalCategories, revenueResult, recentOrders] =
      await Promise.all([
        prisma.product.count(),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.order.count(),
        prisma.category.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: "CANCELLED" } },
        }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { username: true } },
            _count: { select: { items: true } },
          },
        }),
      ]);

    return NextResponse.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalCategories,
      totalRevenue: revenueResult._sum.total || 0,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
