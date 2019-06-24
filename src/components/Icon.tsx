import * as React from 'react'

const pathArrowLeft = (
  <path d="M3.414 7.657l3.95 3.95A1 1 0 0 1 5.95 13.02L.293 7.364a.997.997 0 0 1 0-1.414L5.95.293a1 1 0 1 1 1.414 1.414l-3.95 3.95H13a1 1 0 0 1 0 2H3.414z" />
)

const pathArrowRight = (
  <path d="M10.586 5.657l-3.95-3.95A1 1 0 0 1 8.05.293l5.657 5.657a.997.997 0 0 1 0 1.414L8.05 13.021a1 1 0 1 1-1.414-1.414l3.95-3.95H1a1 1 0 1 1 0-2h9.586z" />
)

const pathChevronLeft = (
  <path d="M2.757 7l4.95 4.95a1 1 0 1 1-1.414 1.414L.636 7.707a1 1 0 0 1 0-1.414L6.293.636A1 1 0 0 1 7.707 2.05L2.757 7z" />
)

const pathChevronRight = (
  <path d="M5.314 7.071l-4.95-4.95A1 1 0 0 1 1.778.707l5.657 5.657a1 1 0 0 1 0 1.414l-5.657 5.657a1 1 0 0 1-1.414-1.414l4.95-4.95z" />
)

interface Props {
  type?: 'chevron' | 'arrow'
  orientation?: 'right' | 'left'
}

const Icon: React.FC<Props> = ({ type, orientation }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-5 -5 24 24"
      width="64"
      height="64"
      preserveAspectRatio="xMinYMin"
    >
      {type === 'chevron'
        ? orientation === 'right'
          ? pathChevronRight
          : pathChevronLeft
        : orientation === 'right'
        ? pathArrowRight
        : pathArrowLeft}
    </svg>
  )
}

Icon.defaultProps = {
  type: 'chevron',
  orientation: 'right'
}

export default Icon
