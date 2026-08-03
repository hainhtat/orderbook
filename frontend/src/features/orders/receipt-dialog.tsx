import { Download, Printer, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Shop } from '@/features/auth/types'
import type { Order, PaymentMethod } from '@/features/orders/types'
import { formatMMK } from '@/lib/format-mmk'
import { cn } from '@/lib/utils'

const DEFAULT_FOOTER = 'Thank you for your order.'
const RECEIPT_FONT =
  'Inter, "Noto Sans Myanmar", "Myanmar Text", ui-sans-serif, system-ui, sans-serif'
const ACCENT = '#1e293b'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  COD: 'COD',
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  KBZPAY_MANUAL: 'KBZPay Manual',
  WAVE_MANUAL: 'Wave Manual',
  OTHER: 'Other',
}

function receiptFooter(shop: Shop): string {
  const value = shop.receiptFooter?.trim()
  return value && value.length > 0 ? value : DEFAULT_FOOTER
}

function formatPaymentLabel(method: PaymentMethod | null | undefined): string {
  if (!method) return 'Unpaid'
  return PAYMENT_LABELS[method] ?? method
}

async function ensureReceiptFonts(): Promise<void> {
  if (!('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load(`600 24px ${RECEIPT_FONT}`),
      document.fonts.load(`400 18px ${RECEIPT_FONT}`),
      document.fonts.load(`500 22px "Noto Sans Myanmar"`),
    ])
  } catch {
    /* fall back to system fonts */
  }
}

async function receiptPng(order: Order, shop: Shop): Promise<Blob> {
  await ensureReceiptFonts()

  const width = 1080
  const contentLeft = 110
  const contentRight = 970
  const amountCol = 970
  const lineHeight = 58
  const height = 900 + order.lineItems.length * lineHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(48, 48, width - 96, height - 96)
  // Thin elegant accent line
  ctx.fillStyle = ACCENT
  ctx.fillRect(48, 48, width - 96, 4)

  let y = 128
  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = `600 44px ${RECEIPT_FONT}`

  if (shop.logoUrl) {
    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = shop.logoUrl
      await image.decode()
      ctx.drawImage(image, width / 2 - 56, y - 36, 112, 112)
      y += 140
    } catch {
      /* name fallback */
    }
  }

  ctx.fillText(shop.name, width / 2, y)
  y += 40
  ctx.font = `400 22px ${RECEIPT_FONT}`
  ctx.fillStyle = '#94a3b8'
  if (shop.address) {
    ctx.fillText(shop.address, width / 2, y)
    y += 32
  }
  if (shop.phone) {
    ctx.fillText(shop.phone, width / 2, y)
    y += 32
  }

  y += 28
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(contentLeft, y)
  ctx.lineTo(contentRight, y)
  ctx.stroke()
  y += 42

  ctx.textAlign = 'left'
  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 14px ${RECEIPT_FONT}`
  ctx.fillText('Order', contentLeft, y)
  ctx.textAlign = 'right'
  ctx.fillText('Date', contentRight, y)
  y += 34
  ctx.textAlign = 'left'
  ctx.fillStyle = '#0f172a'
  ctx.font = `600 28px ${RECEIPT_FONT}`
  ctx.fillText(order.orderNumber, contentLeft, y)
  ctx.textAlign = 'right'
  ctx.font = `400 22px ${RECEIPT_FONT}`
  ctx.fillStyle = '#475569'
  ctx.fillText(new Date(order.createdAt).toLocaleDateString(), contentRight, y)
  y += 34
  ctx.fillStyle = '#0f172a'
  ctx.font = `500 22px ${RECEIPT_FONT}`
  ctx.fillText(formatPaymentLabel(order.paymentMethod), contentRight, y)
  y += 40

  ctx.strokeStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.moveTo(contentLeft, y)
  ctx.lineTo(contentRight, y)
  ctx.stroke()
  y += 42

  ctx.textAlign = 'left'
  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 14px ${RECEIPT_FONT}`
  ctx.fillText('Bill to', contentLeft, y)
  y += 34
  ctx.fillStyle = '#0f172a'
  ctx.font = `600 26px ${RECEIPT_FONT}`
  ctx.fillText(order.customerName, contentLeft, y)
  y += 34
  ctx.font = `400 22px ${RECEIPT_FONT}`
  ctx.fillStyle = '#64748b'
  ctx.fillText(order.customerPhone, contentLeft, y)
  y += 32
  ctx.fillText(`${order.detailedAddress}, ${order.townshipOrCity}`, contentLeft, y)
  y += 48

  // Table header — borders only
  ctx.strokeStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.moveTo(contentLeft, y)
  ctx.lineTo(contentRight, y)
  ctx.stroke()
  y += 32
  ctx.fillStyle = '#64748b'
  ctx.font = `500 14px ${RECEIPT_FONT}`
  ctx.textAlign = 'left'
  ctx.fillText('Item', contentLeft, y)
  ctx.textAlign = 'right'
  ctx.fillText('Amount', amountCol, y)
  y += 18
  ctx.beginPath()
  ctx.moveTo(contentLeft, y)
  ctx.lineTo(contentRight, y)
  ctx.stroke()
  y += 36

  for (const item of order.lineItems) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#0f172a'
    ctx.font = `500 24px ${RECEIPT_FONT}`
    ctx.fillText(item.productName, contentLeft, y)
    ctx.fillStyle = '#94a3b8'
    ctx.font = `400 18px ${RECEIPT_FONT}`
    ctx.fillText(`${formatMMK(item.unitPriceMMK)} × ${item.quantity}`, contentLeft, y + 28)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.font = `500 24px ${RECEIPT_FONT}`
    ctx.fillText(formatMMK(item.lineTotalMMK), amountCol, y + 10)
    y += lineHeight
  }

  y += 8
  ctx.strokeStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.moveTo(contentLeft, y)
  ctx.lineTo(contentRight, y)
  ctx.stroke()
  y += 40

  const totalsLeft = 620
  const row = (label: string, amount: string, emphasize = false) => {
    ctx.font = `${emphasize ? 600 : 400} ${emphasize ? 28 : 22}px ${RECEIPT_FONT}`
    ctx.textAlign = 'left'
    ctx.fillStyle = emphasize ? '#0f172a' : '#94a3b8'
    ctx.fillText(label, totalsLeft, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.fillText(amount, amountCol, y)
    y += emphasize ? 44 : 34
  }

  row('Subtotal', formatMMK(order.subtotalMMK))
  if (order.discountMMK) row('Discount', `-${formatMMK(order.discountMMK)}`)
  row('Total', formatMMK(order.totalMMK), true)

  ctx.textAlign = 'center'
  ctx.font = `400 22px ${RECEIPT_FONT}`
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(receiptFooter(shop), width / 2, height - 88)

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG generation failed'))),
      'image/png',
      1,
    ),
  )
}

export function ReceiptDialog({
  order,
  shop,
  onClose,
}: {
  order: Order
  shop: Shop
  onClose: () => void
}) {
  async function saveOrShare(share: boolean) {
    const blob = await receiptPng(order, shop)
    const file = new File([blob], `${order.orderNumber}.png`, { type: 'image/png' })
    if (share && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `${shop.name} · ${order.orderNumber}` })
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[min(95dvh,920px)] w-[min(56rem,calc(100vw-2rem))] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-y-auto rounded-xl border bg-background p-0 shadow-lg',
          'print:max-h-none print:w-auto print:max-w-none print:translate-x-0 print:translate-y-0 print:overflow-visible',
        )}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {shop.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Receipt {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-8 sm:py-6">
          <article
            id="print-receipt"
            className="receipt-print-area mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-sm"
            style={{ fontFamily: RECEIPT_FONT }}
          >
            <div className="h-1 rounded-t-2xl bg-slate-800" />
            <div className="space-y-7 px-6 py-7 sm:px-10 sm:py-9">
              <header className="text-center">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={`${shop.name} logo`}
                    className="mx-auto mb-3 h-14 max-w-36 object-contain"
                  />
                ) : null}
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {shop.name}
                </h2>
                {shop.address ? (
                  <p className="mt-1.5 text-sm text-slate-400">{shop.address}</p>
                ) : null}
                {shop.phone ? <p className="text-sm text-slate-400">{shop.phone}</p> : null}
              </header>

              <section className="flex items-end justify-between gap-4 border-y border-slate-100 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Order
                  </p>
                  <p className="mt-1.5 truncate text-lg font-semibold tracking-tight text-slate-900">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Date
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatPaymentLabel(order.paymentMethod)}
                  </p>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Bill to
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">{order.customerName}</p>
                <p className="mt-0.5 text-sm text-slate-500">{order.customerPhone}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {order.detailedAddress}
                  <br />
                  {order.townshipOrCity}
                  {order.addressLabel ? ` · ${order.addressLabel}` : ''}
                </p>
              </section>

              <section>
                <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-4 border-y border-slate-200 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  <span>Item</span>
                  <span className="text-right">Amount</span>
                </div>
                {order.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_8rem] gap-4 border-b border-slate-100 py-3.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatMMK(item.unitPriceMMK)} × {item.quantity}
                      </p>
                    </div>
                    <span className="self-start text-right font-medium tabular-nums text-slate-900">
                      {formatMMK(item.lineTotalMMK)}
                    </span>
                  </div>
                ))}
              </section>

              <section className="ml-auto grid w-full max-w-sm grid-cols-[minmax(0,1fr)_8rem] gap-x-4 gap-y-2 text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-right tabular-nums text-slate-900">
                  {formatMMK(order.subtotalMMK)}
                </span>
                {order.discountMMK ? (
                  <>
                    <span className="text-slate-400">Discount</span>
                    <span className="text-right tabular-nums text-slate-900">
                      -{formatMMK(order.discountMMK)}
                    </span>
                  </>
                ) : null}
                <span className="border-t border-slate-200 pt-3 font-semibold text-slate-900">
                  Total
                </span>
                <span className="border-t border-slate-200 pt-3 text-right text-base font-semibold tabular-nums text-slate-900">
                  {formatMMK(order.totalMMK)}
                </span>
              </section>

              <footer className="border-t border-slate-100 pt-5 text-center text-sm leading-relaxed text-slate-400">
                {receiptFooter(shop)}
              </footer>
            </div>
          </article>
        </div>

        <div className="receipt-actions grid shrink-0 grid-cols-2 gap-2 border-t bg-background p-4 sm:flex sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button variant="outline" onClick={() => void saveOrShare(false)}>
            <Download className="mr-2 h-4 w-4" />
            Save PNG
          </Button>
          <Button variant="outline" onClick={() => void saveOrShare(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
