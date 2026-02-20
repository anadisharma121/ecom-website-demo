import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

// PUT /api/orders/[id] - Update order status (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: { status },
      include: {
        user: { select: { username: true } },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    // Send status update email if customer email exists
    if (order.customerEmail && order.emailNotification) {
      sendOrderStatusUpdateEmail({
        orderId: order.id,
        customerEmail: order.customerEmail,
        customerName: order.user.username,
        newStatus: status,
        items: order.items,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        poNumber: order.poNumber,
      }).catch((err) => console.error("[Email] Background status update failed:", err));
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
