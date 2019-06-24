import React, { memo, FC, ComponentType } from 'react'

import Clickable from './Clickable'
import Icon from './Icon'

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
  const style = orientation === 'left' ? { left: '1rem' } : { right: '1rem' }
  return (
    <Clickable
      className={className}
      style={style}
      onClick={() => action()}
      aria-controls={controls}
      aria-label={`${orientation === 'left' ? 'Previous' : 'Next'} Slide`}
      disabled={disabled}
    >
      {custom || <Icon type="chevron" orientation={orientation} />}
    </Clickable>
  )
}

export default memo(Arrow)
