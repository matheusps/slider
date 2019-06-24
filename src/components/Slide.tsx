import React, { FC } from 'react'

import { Div } from '../typings'

interface Props extends Div {
  width?: string | number
}

/**
 * Slide wrapper around each slider's children
 */
const Slide: FC<Props> = props => {
  const { width, style, className, children, ...rest } = props
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        position: 'relative',
        width: `${width}px`,
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default Slide
