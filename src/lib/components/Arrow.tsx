import React, { memo, FC, ComponentType } from 'react'

import Clickable from './Clickable'

interface Props {
  custom?: ComponentType<any>
  className?: string
  orientation: 'left' | 'right'
  action: () => void
  controls: string
  disabled: boolean
}

const Arrow: FC<Props> = props => {
  const { custom, orientation, action, className, controls, disabled } = props
  return (
    <Clickable
      className={`${className} ${
        orientation === 'left' ? 'left-1' : 'right-1'
      }`}
      onClick={() => action()}
      aria-controls={controls}
      aria-label={`${orientation === 'left' ? 'Previous' : 'Next'} Slide`}
      disabled={disabled}
    >
      {custom || <h1>caret</h1>}
    </Clickable>
  )
}

export default memo(Arrow)
