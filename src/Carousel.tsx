import React, {
  FunctionComponent,
  useRef,
  useState,
  useEffect,
  useReducer,
} from 'react'

import {
  throttle,
  getClones,
  whenEnteredClones, // handle when there are clones appear on the screen, only apply to infinite mode.
  getInitialState,
  getTransformForCenterMode,
  getTransformForPartialVsibile,
  throwError,
  getItemClientSideWidth, // get the width of each item on client side only.
  populateNextSlides, // for "next" functionality
  populatePreviousSlides, // for "previous" functionality
  populateSlidesOnMouseTouchMove, // this is to get the values for handling onTouchMove / onMouseMove;
} from './utils'
import Dots from './Dots'
import { LeftArrow, RightArrow } from './Arrows'
import CarouselItems from './CarouselItems'
import { SliderTrack, Container } from './Styled'

const defaultTransitionDuration = 400
const defaultTransition = 'transform 400ms ease-in-out'

interface stateCallBack extends CarouselState {
  onMove: boolean
  direction: string | undefined
}

interface responsiveType {
  [key: string]: {
    breakpoint: { max: number; min: number }
    items: number
    paritialVisibilityGutter?: number
  }
}
interface CarouselProps {
  responsive: responsiveType
  deviceType?: string
  ssr?: boolean
  slidesToSlide?: number
  draggable?: boolean
  arrows?: boolean // show or hide arrows.
  swipeable?: boolean
  removeArrowOnDeviceType?: string | Array<string>
  children: any
  customLeftArrow?: React.ReactElement<any> | null
  customRightArrow?: React.ReactElement<any> | null
  customDot?: React.ReactElement<any> | null
  customButtonGroup?: React.ReactElement<any> | null
  infinite?: boolean
  minimumTouchDrag?: number // default 50px. The amount of distance to drag / swipe in order to move to the next slide.
  afterChange?: (previousSlide: number, state: stateCallBack) => void // Change callback after sliding everytime. `(previousSlide, currentState) => ...`
  beforeChange?: (nextSlide: number, state: stateCallBack) => void // Change callback before sliding everytime. `(previousSlide, currentState) => ...`
  sliderClass?: string // Use this to style your own track list.
  itemClass?: string // Use this to style your own Carousel item. For example add padding-left and padding-right
  containerClass?: string // Use this to style the whole container. For example add padding to allow the "dots" or "arrows" to go to other places without being overflown.
  dotListClass?: string // Use this to style the dot list.
  keyBoardControl?: boolean
  centerMode?: boolean // show previous and next set of items paritially
  autoPlay?: boolean
  autoPlaySpeed?: number // default 3000ms
  showDots?: boolean
  // Show next/previous item partially, if its right, only show the next item partially, else show both
  // partialVisbile has to be used in conjunction with the responsive props, details are in documentation.
  // it shows the next set of items partially, different from centerMode as it shows both.
  partialVisbile?: boolean
  customTransition?: string
  transitionDuration?: number
  // if you are using customTransition, make sure to put the duration here.
  // for example, customTransition="all .5"  then put transitionDuration as 500.
  // this is needed for the resizing to work.
  focusOnSelect?: boolean
}

interface Action {
  type: string
  payload: any
}

interface CarouselState {
  itemWidth: number
  containerWidth: number
  slidesToShow: number
  currentSlide: number
  totalItems: number
  domLoaded: boolean
  deviceType?: string
  transform: number
  isSliding?: boolean
  clones: any[]
}

const carouselActions = {
  /** payload: slidesToShow, deviceType */
  setItemsToShow: 'SET_ITEMS_TO_SHOW',
  /** payload: clones, totalItems, currentSlide */
  setClones: 'SET_CLONES',
  /** payload: transform */
  transform: 'TRANSFORM',
  /** payload: domLoaded */
  loadDom: 'LOAD_DOM',
  /** payload: containerWidth, itemWidth */
  setWidths: 'SET_WIDTHS',
  /** payload: transform, currentSlide */
  transformCurrentSlide: 'TRANSFORM_CURRENT_SLIDE',
}

const reducer = (state: CarouselState, action: Action) => {
  switch (action.type) {
    case carouselActions.setItemsToShow:
      return {
        ...state,
        slidesToShow: action.payload.slidesToShow,
        deviceType: action.payload.deviceType,
      }
    case carouselActions.setClones:
      return {
        ...state,
        clones: action.payload.clones,
        totalItems: action.payload.totalItems,
        currentSlide: action.payload.currentSlide,
      }
    case carouselActions.transform:
      return {
        ...state,
        transform: action.payload.transform,
      }
    case carouselActions.loadDom:
      return {
        ...state,
        domLoaded: action.payload.domLoaded,
      }
    case carouselActions.setWidths:
      return {
        ...state,
        containerWidth: action.payload.containerWidth,
        itemWidth: action.payload.itemWidth,
      }
    case carouselActions.transformCurrentSlide:
      return {
        ...state,
        transform: action.payload.transform,
        currentSlide: action.payload.currentSlide,
      }
    default:
      return { ...state }
  }
}

const Carousel: FunctionComponent<CarouselProps> = props => {
  const initialState: CarouselState = {
    itemWidth: 0,
    slidesToShow: 0,
    currentSlide: 0,
    clones: React.Children.toArray(props.children),
    totalItems: React.Children.count(props.children),
    deviceType: '',
    domLoaded: false,
    transform: 0,
    containerWidth: 0,
    isSliding: false,
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const containerRef = useRef(null)

  let onMove = false
  let initialPosition = 0
  let lastPosition = 0
  let isAnimationAllowed = false
  let direction = ''
  let isInThrottle = false
  let autoPlay: any = null

  /** 
  constructor(props: CarouselProps) {
    this.next = throttle(
      this.next.bind(this),
      props.transitionDuration || defaultTransitionDuration,
      this.setIsInThrottle
    )
    this.previous = throttle(
      this.previous.bind(this),
      props.transitionDuration || defaultTransitionDuration,
      this.setIsInThrottle
    )
    this.goToSlide = throttle(
      this.goToSlide.bind(this),
      props.transitionDuration || defaultTransitionDuration,
      this.setIsInThrottle
    )
  }*/

  const setIsInThrottle = (isInThrottle: boolean = false): void => {
    isInThrottle = isInThrottle
  }

  const setItemsToShow = (shouldCorrectItemPosition?: boolean): void => {
    Object.keys(props.responsive).forEach(item => {
      const { breakpoint, items } = props.responsive[item]
      const { max, min } = breakpoint
      if (window.innerWidth >= min && window.innerWidth <= max) {
        dispatch({
          type: carouselActions.setItemsToShow,
          payload: { slidesToShow: items, deviceType: item },
        })
        console.log(state)
        setContainerAndItemWidth(items, shouldCorrectItemPosition)
      }
    })
  }

  useEffect(() => {
    dispatch({ type: carouselActions.loadDom, payload: { domLoaded: true } })
    setItemsToShow()

    const onResize = (value?: any): void => {
      // value here can be html event or a boolean.
      // if its in infinite mode, we want to keep the current slide index no matter what.
      // if its not infinite mode, keeping the current slide index has already been taken care of
      let shouldCorrectItemPosition
      if (!props.infinite) {
        shouldCorrectItemPosition = false
      } else {
        if (typeof value === 'boolean' && value) {
          shouldCorrectItemPosition = false
        } else {
          shouldCorrectItemPosition = true
        }
      }
      setItemsToShow(shouldCorrectItemPosition)
    }

    window.addEventListener('resize', onResize)
    onResize(true)

    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onKeyUp = (e: any): void => {
      switch (e.keyCode) {
        case 37:
          return previous()
        case 39:
          return next()
      }
    }
    props.keyBoardControl && window.addEventListener('keyup', onKeyUp)
    return () => window.removeEventListener('keyup', onKeyUp)
  }, [])

  useEffect(() => {
    if (props.autoPlay && props.autoPlaySpeed) {
      autoPlay = setInterval(next, props.autoPlaySpeed)
    }
  }, [])

  /**
   * TODO:: MAKE IT BETTER
   * Make sure that the items are in the right position
   * @param itemWidth
   * @param shouldAnimate
   */
  const correctItemsPosition = (
    itemWidth: number,
    shouldAnimate?: boolean
  ): void => {
    if (shouldAnimate) {
      isAnimationAllowed = true
    }
    if (!shouldAnimate && isAnimationAllowed) {
      isAnimationAllowed = false
    }
    dispatch({
      type: carouselActions.transform,
      payload: { transform: -(itemWidth * state.currentSlide) },
    })
  }

  /*
    We only want to set the clones on the client-side cause it relies on getting the width of the carousel items.
    */
  const setClones = (
    slidesToShow: number,
    itemWidth?: number,
    forResizing?: boolean
  ): void => {
    // if forResizing is true, means we are on client-side.
    // if forResizing is false, means we are on server-side.
    // because the first time we set the clones, we change the position of all carousel items when entering client-side from server-side.
    // but still, we want to maintain the same position as it was on the server-side which is translateX(0) by getting the couter part of the original first slide.
    isAnimationAllowed = false
    const childrenArr = React.Children.toArray(props.children)
    const { clones, initialSlide } = getClones(state.slidesToShow, childrenArr)
    dispatch({
      type: carouselActions.setClones,
      payload: {
        clones: clones,
        totalItems: clones.length,
        currentSlide: forResizing ? state.currentSlide : initialSlide,
      },
    })

    correctItemsPosition(itemWidth || state.itemWidth)
  }

  const setContainerAndItemWidth = (
    slidesToShow: number,
    shouldCorrectItemPosition?: boolean
  ): void => {
    if (!containerRef || !containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const itemWidth: number = getItemClientSideWidth(
      props,
      slidesToShow,
      containerWidth
    )

    dispatch({
      type: carouselActions.setWidths,
      payload: { containerWidth, itemWidth },
    })

    props.infinite &&
      setClones(slidesToShow, itemWidth, shouldCorrectItemPosition)

    shouldCorrectItemPosition && correctItemsPosition(itemWidth)
  }

  /*
   componentDidUpdate(
    { keyBoardControl, autoPlay }: CarouselProps,
    { containerWidth, domLoaded, isSliding }: CarouselInternalState
  ): void {
    if (
      this.containerRef &&
      this.containerRef.current &&
      this.containerRef.current.offsetWidth !== containerWidth
    ) {
      // this is for handing resizing only.
      setTimeout(() => {
        this.setItemsToShow(true)
      }, this.props.transitionDuration || defaultTransitionDuration)
    }
    if (keyBoardControl && !this.props.keyBoardControl) {
      window.removeEventListener('keyup', this.onKeyUp)
    }
    if (autoPlay && !this.props.autoPlay && this.autoPlay) {
      clearInterval(this.autoPlay)
      this.autoPlay = undefined
    }
    if (!autoPlay && this.props.autoPlay && !this.autoPlay) {
      this.autoPlay = setInterval(this.next, this.props.autoPlaySpeed)
    }
    if (this.props.infinite) {
      // this is to quickly cancel the animation and move the items position to create the infinite effects.
      this.correctClonesPosition({ domLoaded, isSliding })
    }
  }*/

  const correctClonesPosition = ({
    domLoaded, // this domLoaded comes from previous state, only use to tell if we are on client-side or server-side because this functin relies the dom.
    isSliding,
  }: {
    domLoaded?: boolean
    isSliding?: boolean
  }) => {
    const childrenArr = React.Children.toArray(props.children)

    const {
      hasEnterClonedAfter,
      hasEnterClonedBefore,
      nextSlide,
      nextPosition,
    } = whenEnteredClones(state, childrenArr, props)

    if (
      state.domLoaded &&
      domLoaded &&
      isSliding &&
      !state.isSliding &&
      (hasEnterClonedAfter || hasEnterClonedBefore)
    ) {
      isAnimationAllowed = false
      setTimeout(() => {
        dispatch({
          type: carouselActions.transformCurrentSlide,
          payload: { transform: nextPosition, currentSlide: nextSlide },
        })
      }, props.transitionDuration || defaultTransitionDuration)
    }
  }
  /**
   * two cases:
   * 1. We are not over-sliding.
   * 2. We are sliding over to what we have, that means nextslides > this.props.children.length. (does not apply to the inifnite mode)
   * */
  const next = (slidesHavePassed = 0): void => {
    const { afterChange, beforeChange } = props

    const { nextSlides, nextPosition } = populateNextSlides(
      state,
      props,
      slidesHavePassed
    )
    const previousSlide = state.currentSlide
    if (nextSlides === undefined || nextPosition === undefined) {
      // they can be 0.
      return
    }
    if (typeof beforeChange === 'function') {
      beforeChange(nextSlides, getState())
    }
    isAnimationAllowed = true
    /*
    this.setState(
      {
        isSliding: true,
        transform: nextPosition,
        currentSlide: nextSlides,
      },
      () => {
        this.setState({ isSliding: false })
        if (typeof afterChange === 'function') {
          setTimeout(() => {
            afterChange(previousSlide, getState())
          }, props.transitionDuration || defaultTransitionDuration)
        }
      }
    )*/
  }

  const previous = (slidesHavePassed = 0): void => {
    const { afterChange, beforeChange } = props
    const { nextSlides, nextPosition } = populatePreviousSlides(
      state,
      props,
      slidesHavePassed
    )
    if (nextSlides === undefined || nextPosition === undefined) {
      // they can be 0, which goes back to the first slide.
      return
    }
    const previousSlide = state.currentSlide
    if (typeof beforeChange === 'function') {
      beforeChange(nextSlides, getState())
    }
    isAnimationAllowed = true
    /*
    this.setState(
      {
        isSliding: true,
        transform: nextPosition,
        currentSlide: nextSlides,
      },
      () => {
        this.setState({ isSliding: false })
        if (typeof afterChange === 'function') {
          setTimeout(() => {
            afterChange(previousSlide, getState())
          }, this.props.transitionDuration || defaultTransitionDuration)
        }
      }
    )*/
  }
  /*
   componentWillUnmount(): void {
    window.removeEventListener('resize', this.onResize)
    if (this.props.keyBoardControl) {
      window.removeEventListener('keyup', this.onKeyUp)
    }
    if (this.props.autoPlay && this.autoPlay) {
      clearInterval(this.autoPlay)
      this.autoPlay = undefined
    }
  }*/

  const resetMoveStatus = () => {
    onMove = false
    initialPosition = 0
    lastPosition = 0
    direction = ''
  }

  const handleDown = (e: any) => {
    if (
      (e.touches && !props.swipeable) ||
      (e && !e.touches && !props.draggable) ||
      isInThrottle
    ) {
      return
    }
    const { clientX } = e.touches ? e.touches[0] : e
    onMove = true
    initialPosition = clientX
    lastPosition = clientX
    isAnimationAllowed = false
  }

  /*
  const handleMove = (e: any) => {
    if (
      (e.touches && !props.swipeable) ||
      (e && !e.touches && !props.draggable)
    ) {
      return
    }
    const { clientX } = e.touches ? e.touches[0] : e
    if (e.touches && autoPlay && props.autoPlay) {
      clearInterval(autoPlay)
      autoPlay = undefined
    }
    if (onMove) {
      const {
        direction,
        nextPosition,
        canContinue,
      } = populateSlidesOnMouseTouchMove(
        state,
        props,
        initialPosition,
        lastPosition,
        clientX
      )
      if (direction) {
        this.direction = direction
        if (canContinue && nextPosition !== undefined) {
          // nextPosition can be 0;
          this.setState({ transform: nextPosition })
        }
      }
      this.lastPosition = clientX
    }
  }*/

  /*
  const handleOut = (e: any) => {
    if (this.props.autoPlay && !this.autoPlay) {
      this.autoPlay = setInterval(this.next, this.props.autoPlaySpeed)
    }
    const shouldDisableOnMobile = e.type === 'touchend' && !this.props.swipeable
    const shouldDisableOnDesktop =
      (e.type === 'mouseleave' || e.type === 'mouseup') && !this.props.draggable
    if (shouldDisableOnMobile || shouldDisableOnDesktop) {
      return
    }
    if (this.onMove) {
      if (this.direction === 'right') {
        const canGoNext =
          this.initialPosition - this.lastPosition >=
          this.props.minimumTouchDrag!
        if (canGoNext) {
          const slidesHavePassed = Math.round(
            (this.initialPosition - this.lastPosition) / this.state.itemWidth
          )
          this.next(slidesHavePassed)
        } else {
          this.correctItemsPosition(this.state.itemWidth, true)
        }
      }
      if (this.direction === 'left') {
        const canGoNext =
          this.lastPosition - this.initialPosition >
          this.props.minimumTouchDrag!
        if (canGoNext) {
          const slidesHavePassed = Math.round(
            (this.lastPosition - this.initialPosition) / this.state.itemWidth
          )
          this.previous(slidesHavePassed)
        } else {
          this.correctItemsPosition(this.state.itemWidth, true)
        }
      }
      this.resetMoveStatus()
    }
  }*/

  const handleEnter = () => {
    if (autoPlay && props.autoPlay) {
      clearInterval(autoPlay)
      autoPlay = undefined
    }
  }

  const goToSlide = (slide: number) => {
    if (isInThrottle) {
      return
    }
    const { itemWidth } = state
    const { afterChange, beforeChange } = props
    const previousSlide = state.currentSlide
    if (typeof beforeChange === 'function') {
      beforeChange(slide, getState())
    }
    isAnimationAllowed = true
    /*
    this.setState(
      {
        currentSlide: slide,
        transform: -(itemWidth * slide),
      },
      () => {
        if (this.props.infinite) {
          this.correctClonesPosition({ domLoaded: true, isSliding: true })
        }
        if (typeof afterChange === 'function') {
          setTimeout(() => {
            afterChange(previousSlide, this.getState())
          }, this.props.transitionDuration || defaultTransitionDuration)
        }
      }
    )*/
  }

  const getState = () => {
    return {
      ...state,
      onMove: onMove,
      direction: direction,
    }
  }

  const {
    deviceType,
    slidesToSlide,
    arrows,
    removeArrowOnDeviceType,
    infinite,
    containerClass,
    customTransition,
    partialVisbile,
    centerMode,
  } = props

  throwError(state, props)
  const { shouldRenderOnSSR, paritialVisibilityGutter } = getInitialState(
    state,
    props
  )
  const isLeftEndReach = !(state.currentSlide - slidesToSlide! >= 0)
  const isRightEndReach = !(
    state.currentSlide + 1 + state.slidesToShow <=
    state.totalItems
  )
  const shouldShowArrows =
    arrows &&
    !(
      removeArrowOnDeviceType &&
      ((deviceType && removeArrowOnDeviceType.indexOf(deviceType) > -1) ||
        (state.deviceType &&
          removeArrowOnDeviceType.indexOf(state.deviceType) > -1))
    )
  const disableLeftArrow = !infinite && isLeftEndReach
  const disableRightArrow = !infinite && isRightEndReach

  const currentTransform = partialVisbile
    ? getTransformForPartialVsibile(state, paritialVisibilityGutter)
    : centerMode
    ? getTransformForCenterMode(state, props)
    : state.transform

  return (
    <Container className={containerClass} ref={containerRef}>
      <SliderTrack
        className={props.sliderClass}
        isAnimationAllowed={isAnimationAllowed}
        transition={customTransition || defaultTransition}
        shouldRenderOnSSR={shouldRenderOnSSR}
        transform={currentTransform}
        //onMouseMove={this.handleMove}
        //onMouseDown={this.handleDown}
        //onMouseUp={this.handleOut}
        //onMouseEnter={this.handleEnter}
        //onMouseLeave={this.handleOut}
        //onTouchStart={this.handleDown}
        //onTouchMove={this.handleMove}
        //onTouchEnd={this.handleOut}
      >
        <CarouselItems goToSlide={goToSlide} state={state} props={props} />
      </SliderTrack>

      {shouldShowArrows && !disableLeftArrow && (
        <LeftArrow
          customLeftArrow={props.customLeftArrow}
          getState={() => getState()}
          previous={previous}
        />
      )}
      {shouldShowArrows && !disableRightArrow && (
        <RightArrow
          customRightArrow={props.customRightArrow}
          getState={() => getState()}
          next={next}
        />
      )}

      <Dots
        state={state}
        props={props}
        goToSlide={goToSlide}
        getState={() => getState()}
      />
    </Container>
  )
}

Carousel.defaultProps = {
  slidesToSlide: 1,
  infinite: false,
  draggable: true,
  swipeable: true,
  arrows: true,
  containerClass: '',
  sliderClass: '',
  itemClass: '',
  keyBoardControl: true,
  autoPlaySpeed: 3000,
  showDots: false,
  minimumTouchDrag: 80,
  dotListClass: '',
  focusOnSelect: false,
  centerMode: false,
}

export default Carousel
