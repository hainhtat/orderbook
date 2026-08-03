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
import type { Order } from '@/features/orders/types'
import { formatMMK } from '@/lib/format-mmk'
import { cn } from '@/lib/utils'

const DEFAULT_FOOTER = 'Thank you for your order.'

function receiptFooter(shop: Shop): string {
  const value = shop.receiptFooter?.trim()
  return value && value.length > 0 ? value : DEFAULT_FOOTER
}

async function receiptPng(order: Order, shop: Shop): Promise<Blob> {
  const width = 1080
  const lineHeight = 56
  const height = 920 + order.lineItems.length * lineHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(48, 48, width - 96, height - 96)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(48, 48, width - 96, 14)

  let y = 130
  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = '700 46px Inter, sans-serif'

  if (shop.logoUrl) {
    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = shop.logoUrl
      await image.decode()
      ctx.drawImage(image, width / 2 - 60, y - 40, 120, 120)
      y += 145
    } catch {
      /* name fallback */
    }
  }

  ctx.fillText(shop.name, width / 2, y)
  y += 42
  ctx.font = '24px Inter, sans-serif'
  ctx.fillStyle = '#64748b'
  if (shop.address) {
    ctx.fillText(shop.address, width / 2, y)
    y += 34
  }
  if (shop.phone) {
    ctx.fillText(shop.phone, width / 2, y)
    y += 34
  }

  y += 28
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(90, y, 900, 96)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#64748b'
  ctx.font = '700 18px Inter, sans-serif'
  ctx.fillText('ORDER', 118, y + 36)
  ctx.fillStyle = '#0f172a'
  ctx.font = '700 30px Inter, sans-serif'
  ctx.fillText(order.orderNumber, 118, y + 72)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#64748b'
  ctx.font = '22px Inter, sans-serif'
  ctx.fillText(new Date(order.createdAt).toLocaleDateString(), 970, y + 40)
  ctx.fillStyle = '#0f172a'
  ctx.font = '600 22px Inter, sans-serif'
  ctx.fillText(order.paymentMethod ?? 'Unpaid', 970, y + 74)
  y += 130

  ctx.textAlign = 'left'
  ctx.fillStyle = '#64748b'
  ctx.font = '700 18px Inter, sans-serif'
  ctx.fillText('BILL TO', 110, y)
  y += 36
  ctx.fillStyle = '#0f172a'
  ctx.font = '600 26px Inter, sans-serif'
  ctx.fillText(order.customerName, 110, y)
  y += 34
  ctx.font = '22px Inter, sans-serif'
  ctx.fillStyle = '#475569'
  ctx.fillText(order.customerPhone, 110, y)
  y += 32
  ctx.fillText(`${order.detailedAddress}, ${order.townshipOrCity}`, 110, y)
  y += 56

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(90, y - 28, 900, 48)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 18px Inter, sans-serif'
  ctx.fillText('ITEM', 118, y)
  ctx.textAlign = 'right'
  ctx.fillText('AMOUNT', 970, y)
  y += 44

  for (const item of order.lineItems) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#0f172a'
    ctx.font = '24px Inter, sans-serif'
    ctx.fillText(item.productName, 118, y)
    ctx.fillStyle = '#64748b'
    ctx.font = '18px Inter, sans-serif'
    ctx.fillText(`${formatMMK(item.unitPriceMMK)} × ${item.quantity}`, 118, y + 28)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.font = '600 24px Inter, sans-serif'
    ctx.fillText(formatMMK(item.lineTotalMMK), 970, y + 10)
    y += lineHeight
  }

  y += 12
  ctx.strokeStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.moveTo(110, y)
  ctx.lineTo(970, y)
  ctx.stroke()
  y += 42

  const row = (label: string, amount: string, emphasize = false) => {
    ctx.font = `${emphasize ? 700 : 500} ${emphasize ? 30 : 22}px Inter, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = emphasize ? '#0f172a' : '#64748b'
    ctx.fillText(label, 620, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.fillText(amount, 970, y)
    y += emphasize ? 46 : 36
  }

  row('Subtotal', formatMMK(order.subtotalMMK))
  if (order.discountMMK) row('Discount', `-${formatMMK(order.discountMMK)}`)
  row('Total', formatMMK(order.totalMMK), true)

  ctx.textAlign = 'center'
  ctx.font = '22px Inter, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(receiptFooter(shop), width / 2, height - 90)

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
          <DialogTitle className="text-base font-semibold">{shop.name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Receipt {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-5 sm:px-8 sm:py-6">
          <article
            id="print-receipt"
            className="receipt-print-area mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
          >
            <div className="h-1.5 rounded-t-2xl bg-slate-900" />
            <div className="space-y-6 px-6 py-6 sm:px-10 sm:py-8">
              <header className="text-center">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={`${shop.name} logo`}
                    className="mx-auto mb-3 h-16 max-w-40 object-contain"
                  />
                ) : null}
                <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {shop.name}
                </h2>
                {shop.address ? (
                  <p className="mt-1 text-sm text-slate-500">{shop.address}</p>
                ) : null}
                {shop.phone ? <p className="text-sm text-slate-500">{shop.phone}</p> : null}
              </header>

              <section className="flex items-end justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Order
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-950">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm text-slate-500">
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {order.paymentMethod ?? 'Unpaid'}
                  </p>
                </div>
              </section>

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bill to
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">{order.customerName}</p>
                <p className="text-sm text-slate-600">{order.customerPhone}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {order.detailedAddress}
                  <br />
                  {order.townshipOrCity}
                  {order.addressLabel ? ` · ${order.addressLabel}` : ''}
                </p>
              </section>

              <section>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-slate-900 px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {order.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-slate-100 px-1 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatMMK(item.unitPriceMMK)} × {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-900">
                      {formatMMK(item.lineTotalMMK)}
                    </span>
                  </div>
                ))}
              </section>

              <section className="ml-auto w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="shrink-0 whitespace-nowrap tabular-nums">
                    {formatMMK(order.subtotalMMK)}
                  </span>
                </div>
                {order.discountMMK ? (
                  <div className="flex justify-between gap-8">
                    <span className="text-slate-500">Discount</span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums">
                      -{formatMMK(order.discountMMK)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-8 border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>Total</span>
                  <span className="shrink-0 whitespace-nowrap tabular-nums">
                    {formatMMK(order.totalMMK)}
                  </span>
                </div>
              </section>

              <footer className="border-t border-dashed border-slate-200 pt-5 text-center text-sm text-slate-500">
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
