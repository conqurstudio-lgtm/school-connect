type AuthArrowProps = {
  direction?: 'left' | 'right'
  size?: number
  stroke?: number
}

export function AuthArrow({ direction = 'right', size = 15, stroke = 1.8 }: AuthArrowProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        borderTop: `${stroke}px solid currentColor`,
        borderRight: `${stroke}px solid currentColor`,
        transform: direction === 'right' ? 'rotate(45deg)' : 'rotate(225deg)',
        transformOrigin: 'center',
        flex: '0 0 auto',
      }}
    />
  )
}
