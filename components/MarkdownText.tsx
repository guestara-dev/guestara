// FIX [M-03] Simple markdown renderer — no external deps
interface Props { text: string; className?: string }

export default function MarkdownText({ text, className }: Props) {
  const renderLine = (line: string, i: number) => {
    // Bold **text**
    let parts: (string | JSX.Element)[] = [line]
    const processStr = (s: string): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = []
      const boldRe = /\*\*(.*?)\*\*/g
      let last = 0; let m
      while ((m = boldRe.exec(s)) !== null) {
        if (m.index > last) result.push(s.slice(last, m.index))
        result.push(<strong key={m.index} className="font-semibold text-white">{m[1]}</strong>)
        last = m.index + m[0].length
      }
      if (last < s.length) result.push(s.slice(last))
      return result
    }
    const rendered = processStr(line)
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="ml-4 list-disc">{processStr(line.slice(2))}</li>
    }
    if (line === '') return <div key={i} className="h-1.5" />
    return <p key={i}>{rendered}</p>
  }

  const lines = text.split('\n')
  return (
    <div className={`space-y-0.5 text-sm leading-relaxed ${className??''}`}>
      {lines.map((ln, i) => renderLine(ln, i))}
    </div>
  )
}
