import React, { FC } from 'react'
import csx from 'classnames'
import { Div, transitionType } from '../typings'

interface Props extends Div {
  transform: number
  transition: transitionType
}

const Track: FC<Props> = ({
  children,
  style,
  className,
  transform,
  transition,
  ...rest
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      position: 'relative',
      padding: 0,
      margin: 0,
      willChange: 'transform',
      transition: `transform ${transition.speed}ms ${transition.timing}`,
      transitionDelay: `${transition.delay}ms`,
      transform: `translate3d(${transform}px, 0, 0)`,
      ...style
    }}
    aria-atomic="false"
    aria-live="polite"
    {...rest}
  >
    {children}
  </div>
)

export default Track
