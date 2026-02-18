import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/products - List products
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const isUserView = searchParams.get("userView") === "true";

    if (isUserView && session.user.role === "USER") {
      // Get user's allowed categories
      const userCategories = await prisma.userCategory.findMany({
        where: { userId: parseInt(session.user.id) },
        select: { categoryId: true },
      });

      const categoryIds = userCategories.map((uc: { categoryId: number }) => uc.categoryId);

      // Show products assigned to this user OR unassigned (within their categories)
      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          OR: [
            { assignedToId: parseInt(session.user.id) },
            { assignedToId: null },
          ],
        },
        include: {
          category: { select: { id: true, name: true, emoji: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(products);
    }

    // Admin: return all products with assigned user info
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true, emoji: true } },
        assignedTo: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products - Create product (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, price, image, categoryId, assignedToId } = body;

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, description, price, and category are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image: image || null,
        categoryId: parseInt(categoryId),
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
      },
      include: {
        category: { select: { id: true, name: true, emoji: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
