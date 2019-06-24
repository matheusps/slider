import * as React from 'react'

import { Button } from '../typings'

/**
 * Defines a clickable area
 * @param props : Same props of button
 */
const Clickable: React.FC<Button> = props => {
  const { children, style, className, ...rest } = props

  return (
    <button
      className={className}
      style={{
        background: 'transparent',
        position: 'absolute',
        margin: '.5rem',
        display: 'flex',
        border: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        outline: 0,
        ...style
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Clickable
