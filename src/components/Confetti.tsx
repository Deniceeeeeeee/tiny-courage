export default function Confetti({ large = false }: { large?: boolean }) {
  return (
    <div className={`confetti ${large ? 'large' : ''}`} aria-hidden="true">
      {Array.from({ length: large ? 34 : 14 }, (_, index) => (
        <i key={index} style={{ '--i': index } as React.CSSProperties} />
      ))}
    </div>
  )
}
