import styled from 'styled-components'

export const Arrow = styled.button`
  position: absolute;
  outline: none;
  transition: all 0.5s;
  border-radius: 35px;
  z-index: 1000;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  min-width: 43px;
  min-height: 43px;
  opacity: 1;
  cursor: pointer;
  :hover {
    background: rgba(0, 0, 0, 0.8);
  }
  ::before {
    font-size: 20px;
    color: #fff;
    display: block;
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
    z-index: 2;
    position: relative;
  }
`

export const ArrowLeft = styled(Arrow)`
  left: calc(3% + 1px);
  :before {
    content: '⏪';
  }
`

export const ArrowRight = styled(Arrow)`
  right: calc(3% + 1px);
  :before {
    content: '⏩';
  }
`
