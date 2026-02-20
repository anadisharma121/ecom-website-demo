import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

// GET /api/orders - Get orders
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    if (isAdmin && session.user.role === "ADMIN") {
      // Admin: get all orders
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { username: true } },
          items: {
            include: {
              product: { select: { name: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    // User: get own orders
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(session.user.id) },
      include: {
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Orders already include deliveryAddress, poNumber, emailNotification from the model

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/orders - Create order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, deliveryAddress, poNumber, customerEmail } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have items" }, { status: 400 });
    }

    if (!deliveryAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: parseInt(session.user.id),
        total,
        deliveryAddress,
        poNumber: poNumber || null,
        customerEmail,
        emailNotification: true,
        items: {
          create: items.map(
            (item: { productId: number; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })
          ),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    // Send order confirmation email
    sendOrderConfirmationEmail({
      orderId: order.id,
      customerEmail,
      customerName: session.user.name,
      items: order.items,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      poNumber: order.poNumber,
      createdAt: order.createdAt,
    }).catch((err) => console.error("[Email] Background send failed:", err));

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/orders - Clear all orders (admin only)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("clearAll") === "true") {
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      return NextResponse.json({ message: "All orders cleared" });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Orders DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
