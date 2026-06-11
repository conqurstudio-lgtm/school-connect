'use client'

type Props = {
  label: string
  value: number
  onChange: (value: number) => void
  isLast?: boolean
}

export default function SCScoreRow({ label, value, onChange, isLast = false }: Props) {
  return (
    <div
      className="sc-score-row"
      style={{
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--sc-border-soft)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 9,
        }}
      >
        <span
          style={{
            minWidth: 0,
            color: 'var(--sc-ink)',
            fontSize: 13.55,
            fontWeight: 560,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: 'var(--sc-ink-3)',
            fontSize: 12.1,
            fontWeight: 540,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {value}/5
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label={`${label} score`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 7,
        }}
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const active = value === score

          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(score)}
              className="sc-score-button"
              style={{
                minHeight: 36,
                borderRadius: 999,
                border: active ? 'none' : '1px solid var(--sc-border-soft)',
                background: active ? 'var(--sc-ink)' : 'var(--sc-soft)',
                color: active ? 'var(--sc-bg)' : 'var(--sc-ink-2)',
                fontSize: 12.6,
                fontWeight: 560,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {score}
            </button>
          )
        })}
      </div>
    </div>
  )
}
