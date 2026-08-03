import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

const ORDER_NUMBER_PATTERN = /\b([A-Z][A-Z0-9]*-\d{4}-\d+)\b/g
const BOLD_PATTERN = /\*\*(.+?)\*\*/g

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  const pattern = new RegExp(`${ORDER_NUMBER_PATTERN.source}|${BOLD_PATTERN.source}`, 'g')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      const orderNumber = match[1]
      nodes.push(
        <Link
          key={`${orderNumber}-${match.index}`}
          to={`/orders?search=${encodeURIComponent(orderNumber)}`}
          className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
          onClick={(event) => event.stopPropagation()}
        >
          {orderNumber}
        </Link>,
      )
    } else if (match[2]) {
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-foreground">
          {match[2]}
        </strong>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

function renderBlock(block: string): ReactNode {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
  const isList = lines.every((line) => /^([-*•]|\d+\.)\s/.test(line))

  if (isList && lines.length > 0) {
    return (
      <ul className="list-disc space-y-1.5 pl-5">
        {lines.map((line, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(line.replace(/^([-*•]|\d+\.)\s+/, ''))}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className="leading-relaxed whitespace-pre-wrap">
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? <br /> : null}
          {renderInline(line)}
        </Fragment>
      ))}
    </p>
  )
}

export function AssistantMessageContent({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return null
  }

  return <div className="space-y-3 text-sm">{blocks.map((block, index) => <div key={index}>{renderBlock(block)}</div>)}</div>
}
