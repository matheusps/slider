import * as React from 'react'
import { render } from 'react-dom'
import styled from 'styled-components'

import Carousel from './Carousel'

import { products } from './data'
import './assets/styles.css'
import './styles.css'

const Card = styled.div`
  padding: 1rem;
  background-color: black;
  height: 25em;
  border-radius: 1em;
  margin: 0.5em;
`

const Image = styled.img`
  max-width: 100%;
  height: auto;
`

const Product = ({ image }) => {
  return (
    <Card>
      <Image src={image} />
    </Card>
  )
}

const App = () => {
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 4,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  }
  return (
    <div className="app">
      <Carousel
        swipeable
        draggable
        responsive={responsive}
        ssr
        slidesToSlide={4}
        infinite
        containerClass="container-with-dots"
        itemClass=""
        focusOnSelect={false}
        minimumTouchDrag={80}
      >
        {products.map(product => (
          <Product image={product.image} />
        ))}
      </Carousel>
    </div>
  )
}

const rootElement = document.getElementById('root')
render(<App />, rootElement)
