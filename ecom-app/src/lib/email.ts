import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@store.co.uk";
const STORE_NAME = process.env.STORE_NAME || "Our Store";

interface OrderItem {
  quantity: number;
  price: number;
  product: { name: string };
}

interface OrderConfirmationData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  deliveryAddress: string | null;
  poNumber: string | null;
  createdAt: Date;
}

interface StatusUpdateData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  newStatus: string;
  items: OrderItem[];
  total: number;
  deliveryAddress: string | null;
  poNumber: string | null;
}

function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    PENDING: "⏳",
    CONFIRMED: "✅",
    PROCESSING: "🔄",
    SHIPPED: "🚚",
    DELIVERED: "📦",
    CANCELLED: "❌",
  };
  return map[status] || "📋";
}

function getStatusMessage(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Your order is pending and will be reviewed shortly.",
    CONFIRMED: "Great news! Your order has been confirmed and is being prepared.",
    PROCESSING: "Your order is currently being processed.",
    SHIPPED: "Your order has been shipped and is on its way to you!",
    DELIVERED: "Your order has been delivered. We hope you enjoy your purchase!",
    CANCELLED: "Your order has been cancelled. If you have questions, please contact us.",
  };
  return map[status] || "Your order status has been updated.";
}

function buildItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.product.name}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantity}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #334155;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0;">Product</th>
          <th style="padding: 12px 16px; text-align: center; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0;">Qty</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0;">Price</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${STORE_NAME}</h1>
      <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">${title}</p>
    </div>
    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      <p style="margin: 4px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[Email] SMTP not configured. Skipping order confirmation email for order #" + data.orderId);
    console.log("[Email] To enable emails, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
    return false;
  }

  const content = `
    <h2 style="color: #334155; margin: 0 0 8px;">Order Confirmation</h2>
    <p style="color: #64748b; margin: 0 0 24px; font-size: 15px;">
      Thank you for your order, <strong>${data.customerName}</strong>! Here are your order details:
    </p>

    <!-- Order Info -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #334155; font-size: 14px;">#${data.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Date:</td>
          <td style="padding: 4px 0; text-align: right; color: #334155; font-size: 14px;">${formatDate(data.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Status:</td>
          <td style="padding: 4px 0; text-align: right; font-size: 14px;">
            <span style="background: #fef3c7; color: #92400e; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">⏳ PENDING</span>
          </td>
        </tr>
        ${data.poNumber ? `
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">PO Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #334155; font-size: 14px;">${data.poNumber}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Buyer:</td>
          <td style="padding: 4px 0; text-align: right; color: #334155; font-size: 14px;">${data.customerName}</td>
        </tr>
      </table>
    </div>

    <!-- Items -->
    <h3 style="color: #334155; margin: 0 0 4px; font-size: 16px;">Items Ordered</h3>
    ${buildItemsTable(data.items)}

    <!-- Total -->
    <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="font-size: 18px; font-weight: 700; color: #334155;">Total</td>
          <td style="text-align: right; font-size: 18px; font-weight: 700; color: #059669;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    ${data.deliveryAddress ? `
    <!-- Delivery Address -->
    <div style="margin-top: 24px;">
      <h3 style="color: #334155; margin: 0 0 8px; font-size: 16px;">📍 Delivery Address</h3>
      <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">${data.deliveryAddress}</p>
    </div>` : ""}

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
      We'll email you when your order status is updated.
    </p>`;

  const html = baseTemplate("Order Confirmation", content);

  try {
    await transporter.sendMail({
      from: `"${STORE_NAME}" <${FROM_EMAIL}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - #${data.orderId}`,
      html,
    });
    console.log(`[Email] Order confirmation sent for order #${data.orderId} to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send order confirmation for order #${data.orderId}:`, error);
    return false;
  }
}

export async function sendOrderStatusUpdateEmail(data: StatusUpdateData): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[Email] SMTP not configured. Skipping status update email for order #" + data.orderId);
    return false;
  }

  const emoji = getStatusEmoji(data.newStatus);
  const statusMessage = getStatusMessage(data.newStatus);

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    CONFIRMED: { bg: "#dbeafe", text: "#1e40af" },
    PROCESSING: { bg: "#e0e7ff", text: "#3730a3" },
    SHIPPED: { bg: "#ede9fe", text: "#5b21b6" },
    DELIVERED: { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  };

  const color = statusColors[data.newStatus] || { bg: "#f1f5f9", text: "#334155" };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 8px;">${emoji}</div>
      <h2 style="color: #334155; margin: 0 0 8px;">Order Status Update</h2>
      <p style="color: #64748b; margin: 0; font-size: 15px;">${statusMessage}</p>
    </div>

    <!-- Status Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background: ${color.bg}; color: ${color.text}; padding: 6px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">
        ${emoji} ${data.newStatus}
      </span>
    </div>

    <!-- Order Info -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #334155; font-size: 14px;">#${data.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Buyer:</td>
          <td style="padding: 4px 0; text-align: right; color: #334155; font-size: 14px;">${data.customerName}</td>
        </tr>
        ${data.poNumber ? `
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">PO Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #334155; font-size: 14px;">${data.poNumber}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Total:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #059669; font-size: 14px;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Items -->
    <h3 style="color: #334155; margin: 0 0 4px; font-size: 16px;">Items in this Order</h3>
    ${buildItemsTable(data.items)}

    ${data.deliveryAddress ? `
    <!-- Delivery Address -->
    <div style="margin-top: 24px;">
      <h3 style="color: #334155; margin: 0 0 8px; font-size: 16px;">📍 Delivery Address</h3>
      <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">${data.deliveryAddress}</p>
    </div>` : ""}

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
      Thank you for shopping with us!
    </p>`;

  const html = baseTemplate("Order Status Update", content);

  try {
    await transporter.sendMail({
      from: `"${STORE_NAME}" <${FROM_EMAIL}>`,
      to: data.customerEmail,
      subject: `Order #${data.orderId} - ${data.newStatus} ${emoji}`,
      html,
    });
    console.log(`[Email] Status update (${data.newStatus}) sent for order #${data.orderId} to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send status update for order #${data.orderId}:`, error);
    return false;
  }
}
