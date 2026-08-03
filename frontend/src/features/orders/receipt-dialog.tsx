import { Download, Printer, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Shop } from '@/features/auth/types'
import type { Order } from '@/features/orders/types'
import { formatMMK } from '@/lib/format-mmk'

async function receiptPng(order: Order, shop: Shop): Promise<Blob> {
  const width = 1080; const lineHeight = 58; const height = 980 + order.lineItems.length * lineHeight
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#eaf2fb'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#fff'; ctx.fillRect(50, 50, width - 100, height - 100); ctx.fillStyle = '#164e78'; ctx.fillRect(50, 50, width - 100, 18)
  ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '700 48px Inter, sans-serif'
  let y = 135
  if (shop.logoUrl) { try { const image = new Image(); image.crossOrigin = 'anonymous'; image.src = shop.logoUrl; await image.decode(); ctx.drawImage(image, width / 2 - 65, y - 45, 130, 130); y += 155 } catch { /* name fallback below */ } }
  ctx.fillText(shop.name, width / 2, y); y += 44; ctx.font = '26px Inter, sans-serif'; ctx.fillStyle = '#64748b'
  if (shop.address) { ctx.fillText(shop.address, width / 2, y); y += 36 } if (shop.phone) { ctx.fillText(shop.phone, width / 2, y); y += 36 }
  ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(100, y + 20); ctx.lineTo(980, y + 20); ctx.stroke(); ctx.setLineDash([]); y += 75
  ctx.textAlign = 'left'; ctx.fillStyle = '#164e78'; ctx.font = '700 27px Inter, sans-serif'; ctx.fillText('RECEIPT', 100, y); ctx.textAlign = 'right'; ctx.fillStyle = '#0f172a'; ctx.font = '24px Inter, sans-serif'; ctx.fillText(order.orderNumber, 980, y); y += 36; ctx.textAlign = 'right'; ctx.fillStyle = '#64748b'; ctx.font = '19px Inter, sans-serif'; ctx.fillText(`Order ID: ${order.id.slice(-12)}`, 980, y); y += 48
  ctx.textAlign = 'left'; ctx.font = '700 24px Inter, sans-serif'; ctx.fillText('BILL TO', 100, y); y += 38; ctx.font = '25px Inter, sans-serif'; ctx.fillText(order.customerName, 100, y); y += 34; ctx.fillText(order.customerPhone, 100, y); y += 34; ctx.fillStyle = '#475569'; ctx.fillText(`${order.detailedAddress}, ${order.townshipOrCity}`, 100, y); y += 70
  ctx.fillStyle = '#e0effa'; ctx.fillRect(90, y - 36, 900, 54); ctx.fillStyle = '#164e78'; ctx.font = '700 22px Inter, sans-serif'; ctx.fillText('ITEM', 110, y); ctx.textAlign = 'right'; ctx.fillText('AMOUNT', 970, y); y += 54
  for (const item of order.lineItems) { ctx.textAlign = 'left'; ctx.fillStyle = '#0f172a'; ctx.font = '24px Inter, sans-serif'; ctx.fillText(`${item.productName}  × ${item.quantity}`, 110, y); ctx.textAlign = 'right'; ctx.fillText(formatMMK(item.lineTotalMMK), 970, y); y += lineHeight }
  y += 18; ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(980, y); ctx.stroke(); y += 48
  const total = (label: string, amount: string, bold = false) => { ctx.font = `${bold ? 700 : 400} ${bold ? 32 : 24}px Inter, sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#334155'; ctx.fillText(label, 600, y); ctx.textAlign = 'right'; ctx.fillStyle = '#0f172a'; ctx.fillText(amount, 970, y); y += bold ? 48 : 38 }
  total('Subtotal', formatMMK(order.subtotalMMK)); if (order.discountMMK) total('Discount', `-${formatMMK(order.discountMMK)}`); total('TOTAL', formatMMK(order.totalMMK), true)
  ctx.textAlign = 'center'; ctx.font = '22px Inter, sans-serif'; ctx.fillStyle = '#64748b'; ctx.fillText('Thank you for your order.', width / 2, height - 105)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG generation failed')), 'image/png', 1))
}

export function ReceiptDialog({ order, shop, onClose }: { order: Order; shop: Shop; onClose: () => void }) {
  async function saveOrShare(share: boolean) { const blob = await receiptPng(order, shop); const file = new File([blob], `${order.orderNumber}.png`, { type: 'image/png' }); if (share && navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `${shop.name} · ${order.orderNumber}` }); return } const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url) }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[95dvh] max-w-md overflow-y-auto p-0 print:max-h-none print:max-w-none print:overflow-visible"><DialogHeader className="sr-only"><DialogTitle>Receipt</DialogTitle><DialogDescription>{order.orderNumber}</DialogDescription></DialogHeader>
    <article id="print-receipt" className="receipt-print-area min-w-0 border-t-8 border-sky-800 bg-white p-6 text-slate-900 sm:p-8">
      <header className="text-center">{shop.logoUrl ? <img src={shop.logoUrl} alt={`${shop.name} logo`} className="mx-auto mb-3 h-20 max-w-40 object-contain" /> : <h2 className="text-2xl font-bold text-sky-950">{shop.name}</h2>}{shop.logoUrl ? <h2 className="text-lg font-semibold text-sky-950">{shop.name}</h2> : null}{shop.address ? <p className="mt-1 text-sm text-slate-500">{shop.address}</p> : null}{shop.phone ? <p className="text-sm text-slate-500">{shop.phone}</p> : null}</header>
      <div className="my-5 border-t border-dashed" />
      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><p className="text-xs font-bold tracking-widest text-sky-700">RECEIPT</p><p className="break-all font-semibold">{order.orderNumber}</p><p className="mt-1 break-all text-[11px] text-slate-400">Order ID: {order.id}</p></div><div className="shrink-0 text-right text-xs text-slate-500 sm:text-sm"><p>{new Date(order.createdAt).toLocaleDateString()}</p><p className="mt-1 font-medium text-sky-800">{order.paymentMethod ?? 'Unpaid'}</p></div></section>
      <section className="my-5 rounded-xl border border-sky-100 bg-sky-50/70 p-4"><p className="text-xs font-bold tracking-widest text-sky-700">BILL TO</p><p className="mt-2 font-bold">{order.customerName}</p><p className="text-sm">{order.customerPhone}</p><p className="mt-1 break-words text-sm leading-6 text-slate-600">{order.detailedAddress}<br />{order.townshipOrCity}{order.addressLabel ? ` · ${order.addressLabel}` : ''}</p></section>
      <section className="min-w-0"><div className="grid grid-cols-[minmax(0,1fr)_auto] bg-sky-100/80 px-3 py-2 text-xs font-bold tracking-wider text-sky-900"><span>ITEM</span><span>AMOUNT</span></div>{order.lineItems.map((item) => <div key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b px-3 py-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{item.productName}</p><p className="text-xs text-slate-500">{formatMMK(item.unitPriceMMK)} × {item.quantity}</p></div><span className="whitespace-nowrap font-semibold">{formatMMK(item.lineTotalMMK)}</span></div>)}</section>
      <section className="ml-auto mt-5 w-full max-w-64 space-y-2 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Subtotal</span><span className="whitespace-nowrap">{formatMMK(order.subtotalMMK)}</span></div>{order.discountMMK ? <div className="flex justify-between gap-4"><span className="text-slate-500">Discount</span><span className="whitespace-nowrap">-{formatMMK(order.discountMMK)}</span></div> : null}<div className="flex justify-between gap-4 border-t border-sky-200 pt-3 text-lg font-bold text-sky-950"><span>Total</span><span className="whitespace-nowrap">{formatMMK(order.totalMMK)}</span></div></section>
      <footer className="mt-8 border-t border-dashed pt-5 text-center text-xs text-slate-500">Thank you for your order.</footer>
    </article>
    <div className="receipt-actions grid grid-cols-2 gap-2 border-t bg-background p-4 sm:flex sm:justify-end"><Button variant="ghost" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button><Button variant="outline" onClick={() => void saveOrShare(false)}><Download className="mr-2 h-4 w-4" />Save PNG</Button><Button variant="outline" onClick={() => void saveOrShare(true)}><Share2 className="mr-2 h-4 w-4" />Share</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
  </DialogContent></Dialog>
}
