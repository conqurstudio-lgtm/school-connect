'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type RGB = {
  r: number
  g: number
  b: number
  a: number
}

export type AdaptiveGlassSense = {
  onLight: boolean
  luminance: number
}

type GlassSetter = (
  value: AdaptiveGlassSense
) => void

type GlassEntry = {
  el: HTMLElement
  setState: GlassSetter
  onLight: boolean
  luminance: number
}

type AdaptiveGlassContextValue = {
  register: (
    el: HTMLElement,
    setState: GlassSetter
  ) => () => void
  requestSample: () => void
}

const AdaptiveGlassContext =
  createContext<AdaptiveGlassContextValue | null>(
    null
  )

/*
 * Different enter/leave values prevent rapid
 * light/dark flickering around mixed backgrounds.
 */
const LIGHT_ENTER = 0.48
const LIGHT_LEAVE = 0.38

const SAMPLE_POINTS: Array<[number, number]> = [
  [0.20, 0.22],
  [0.50, 0.22],
  [0.80, 0.22],
  [0.20, 0.50],
  [0.50, 0.50],
  [0.80, 0.50],
  [0.20, 0.78],
  [0.50, 0.78],
  [0.80, 0.78],
]

const PAGE_FALLBACK: RGB = {
  r: 255,
  g: 255,
  b: 255,
  a: 1,
}

const CONTENT_FALLBACK: RGB = {
  r: 40,
  g: 42,
  b: 46,
  a: 1,
}

const imageCache =
  new WeakMap<
    HTMLImageElement,
    ImageData | 'tainted'
  >()

function parseHex(
  input: string
): RGB | null {
  let value = input
    .replace('#', '')
    .trim()

  if (
    value.length === 3 ||
    value.length === 4
  ) {
    value = value
      .split('')
      .map(char => char + char)
      .join('')
  }

  if (value.length === 6) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: 1,
    }
  }

  if (value.length === 8) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a:
        parseInt(value.slice(6, 8), 16) /
        255,
    }
  }

  return null
}

function parseCssColor(
  input: string
): RGB | null {
  if (!input) return null

  const value =
    input.trim().toLowerCase()

  if (
    value === 'transparent' ||
    value === 'none'
  ) {
    return null
  }

  if (value.startsWith('#')) {
    return parseHex(value)
  }

  let match = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/
  )

  if (match) {
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a:
        match[4] !== undefined
          ? Number(match[4])
          : 1,
    }
  }

  match = value.match(
    /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/
  )

  if (match) {
    let alpha = 1

    if (match[4]) {
      alpha = match[4].endsWith('%')
        ? parseFloat(match[4]) / 100
        : Number(match[4])
    }

    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a: alpha,
    }
  }

  return null
}

function relativeLuminance(
  color: RGB
) {
  const linear = (channel: number) => {
    const value =
      Math.min(
        255,
        Math.max(0, channel)
      ) / 255

    return value <= 0.04045
      ? value / 12.92
      : Math.pow(
          (value + 0.055) / 1.055,
          2.4
        )
  }

  return (
    0.2126 * linear(color.r) +
    0.7152 * linear(color.g) +
    0.0722 * linear(color.b)
  )
}

function composite(
  source: RGB,
  destination: RGB
): RGB {
  const alpha =
    source.a +
    destination.a *
      (1 - source.a)

  if (alpha === 0) {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }
  }

  return {
    r:
      (
        source.r * source.a +
        destination.r *
          destination.a *
          (1 - source.a)
      ) / alpha,

    g:
      (
        source.g * source.a +
        destination.g *
          destination.a *
          (1 - source.a)
      ) / alpha,

    b:
      (
        source.b * source.a +
        destination.b *
          destination.a *
          (1 - source.a)
      ) / alpha,

    a: alpha,
  }
}

function parseObjectPosition(
  input: string
): [number, number] {
  const parsePart = (
    value: string
  ) => {
    if (value.endsWith('%')) {
      return parseFloat(value) / 100
    }

    if (
      value === 'left' ||
      value === 'top'
    ) {
      return 0
    }

    if (
      value === 'right' ||
      value === 'bottom'
    ) {
      return 1
    }

    return 0.5
  }

  const parts =
    input.trim().split(/\s+/)

  return [
    parsePart(parts[0] || '50%'),
    parsePart(parts[1] || '50%'),
  ]
}

function getImageData(
  image: HTMLImageElement
):
  | ImageData
  | 'tainted'
  | null {
  if (imageCache.has(image)) {
    return imageCache.get(image)!
  }

  if (
    !image.complete ||
    image.naturalWidth === 0
  ) {
    return null
  }

  try {
    /*
     * Tiny cached copy keeps sampling cheap
     * on mobile even for large Moment photos.
     */
    const maxWidth = 96

    const scale = Math.min(
      1,
      maxWidth / image.naturalWidth
    )

    const width = Math.max(
      1,
      Math.round(
        image.naturalWidth * scale
      )
    )

    const height = Math.max(
      1,
      Math.round(
        image.naturalHeight * scale
      )
    )

    const canvas =
      document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const context =
      canvas.getContext(
        '2d',
        {
          willReadFrequently: true,
        }
      )

    if (!context) return null

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    )

    const data =
      context.getImageData(
        0,
        0,
        width,
        height
      )

    imageCache.set(image, data)

    return data
  } catch {
    imageCache.set(
      image,
      'tainted'
    )

    return 'tainted'
  }
}

function sampleImage(
  image: HTMLImageElement,
  clientX: number,
  clientY: number
): RGB | null {
  const data =
    getImageData(image)

  if (data === 'tainted') {
    return CONTENT_FALLBACK
  }

  if (!data) return null

  const rect =
    image.getBoundingClientRect()

  const naturalWidth =
    image.naturalWidth

  const naturalHeight =
    image.naturalHeight

  if (
    !naturalWidth ||
    !naturalHeight
  ) {
    return null
  }

  const style =
    getComputedStyle(image)

  const fit = style.objectFit

  const [positionX, positionY] =
    parseObjectPosition(
      style.objectPosition ||
        '50% 50%'
    )

  let scaleX: number
  let scaleY: number
  let offsetX: number
  let offsetY: number

  if (
    fit === 'cover' ||
    fit === 'contain'
  ) {
    const scale =
      fit === 'cover'
        ? Math.max(
            rect.width /
              naturalWidth,
            rect.height /
              naturalHeight
          )
        : Math.min(
            rect.width /
              naturalWidth,
            rect.height /
              naturalHeight
          )

    scaleX = scale
    scaleY = scale

    const drawnWidth =
      naturalWidth * scale

    const drawnHeight =
      naturalHeight * scale

    offsetX =
      (
        rect.width -
        drawnWidth
      ) * positionX

    offsetY =
      (
        rect.height -
        drawnHeight
      ) * positionY
  } else {
    scaleX =
      rect.width /
      naturalWidth

    scaleY =
      rect.height /
      naturalHeight

    offsetX = 0
    offsetY = 0
  }

  const imageX =
    (
      clientX -
      rect.left -
      offsetX
    ) / scaleX

  const imageY =
    (
      clientY -
      rect.top -
      offsetY
    ) / scaleY

  if (
    imageX < 0 ||
    imageY < 0 ||
    imageX >= naturalWidth ||
    imageY >= naturalHeight
  ) {
    return null
  }

  const sampleX = Math.min(
    data.width - 1,
    Math.max(
      0,
      Math.floor(
        (
          imageX /
          naturalWidth
        ) * data.width
      )
    )
  )

  const sampleY = Math.min(
    data.height - 1,
    Math.max(
      0,
      Math.floor(
        (
          imageY /
          naturalHeight
        ) * data.height
      )
    )
  )

  const index =
    (
      sampleY *
        data.width +
      sampleX
    ) * 4

  return {
    r: data.data[index],
    g:
      data.data[
        index + 1
      ],
    b:
      data.data[
        index + 2
      ],
    a:
      data.data[
        index + 3
      ] / 255,
  }
}

function extractVisual(
  element: Element,
  x: number,
  y: number
): RGB | null {
  if (
    !(
      element instanceof
      HTMLElement
    )
  ) {
    return null
  }

  const style =
    getComputedStyle(element)

  if (
    style.visibility ===
      'hidden' ||
    style.display === 'none'
  ) {
    return null
  }

  if (
    parseFloat(
      style.opacity || '1'
    ) < 0.04
  ) {
    return null
  }

  if (
    element instanceof
    HTMLImageElement
  ) {
    return (
      sampleImage(
        element,
        x,
        y
      ) ||
      CONTENT_FALLBACK
    )
  }

  if (
    element instanceof
      HTMLVideoElement ||
    element instanceof
      HTMLCanvasElement
  ) {
    return CONTENT_FALLBACK
  }

  const background =
    parseCssColor(
      style.backgroundColor
    )

  if (
    background &&
    background.a > 0.02
  ) {
    return background
  }

  return null
}

function samplePoint(
  x: number,
  y: number
): RGB {
  if (
    x < 0 ||
    y < 0 ||
    x > window.innerWidth ||
    y > window.innerHeight
  ) {
    return PAGE_FALLBACK
  }

  const elements =
    document.elementsFromPoint(
      x,
      y
    )

  const layers: RGB[] = []

  for (
    const element of elements
  ) {
    /*
     * Never sample the glass itself.
     */
    if (
      element.closest(
        '[data-sc-adaptive-glass]'
      )
    ) {
      continue
    }

    if (
      element ===
        document.documentElement ||
      element ===
        document.body
    ) {
      continue
    }

    const visual =
      extractVisual(
        element,
        x,
        y
      )

    if (!visual) continue

    layers.push(visual)

    if (visual.a >= 0.94) {
      break
    }
  }

  const parsedBody =
    parseCssColor(
      getComputedStyle(
        document.body
      ).backgroundColor
    )

  const parsedHtml =
    parseCssColor(
      getComputedStyle(
        document.documentElement
      ).backgroundColor
    )

  const pageColor =
    parsedBody &&
    parsedBody.a > 0.02
      ? parsedBody
      : parsedHtml &&
          parsedHtml.a > 0.02
        ? parsedHtml
        : PAGE_FALLBACK

  layers.push({
    ...pageColor,
    a: 1,
  })

  let result =
    layers[
      layers.length - 1
    ]

  for (
    let index =
      layers.length - 2;
    index >= 0;
    index--
  ) {
    result = composite(
      layers[index],
      result
    )
  }

  return result
}

function sampleElementBackground(
  element: HTMLElement
) {
  /*
   * Find the OUTERMOST adaptive glass control.
   * The registered ref may be the inner icon/text,
   * while the actual button is its parent.
   */
  let glassRoot: HTMLElement = element
  let node: HTMLElement | null = element

  while (node) {
    if (
      node.hasAttribute(
        'data-sc-adaptive-glass'
      )
    ) {
      glassRoot = node
    }

    node = node.parentElement
  }

  const rect =
    glassRoot.getBoundingClientRect()

  if (
    rect.width < 2 ||
    rect.height < 2
  ) {
    return 0.5
  }

  /*
   * Temporarily remove the complete glass control
   * from hit-testing so elementsFromPoint can see
   * the real photo/page underneath it.
   */
  const previousPointerEvents =
    glassRoot.style.pointerEvents

  glassRoot.style.pointerEvents = 'none'

  const values: number[] = []

  try {
    for (
      const [fx, fy] of
      SAMPLE_POINTS
    ) {
      const x =
        rect.left +
        rect.width * fx

      const y =
        rect.top +
        rect.height * fy

      if (
        y < 0 ||
        y > window.innerHeight
      ) {
        continue
      }

      values.push(
        relativeLuminance(
          samplePoint(x, y)
        )
      )
    }
  } finally {
    glassRoot.style.pointerEvents =
      previousPointerEvents
  }

  if (!values.length) {
    return 0.5
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  )
}

export function AdaptiveGlassProvider({
  children,
}: {
  children: ReactNode
}) {
  const entries =
    useRef(
      new Map<
        number,
        GlassEntry
      >()
    )

  const uid = useRef(0)
  const raf = useRef(0)

  const sampleAll =
    useCallback(() => {
      entries.current.forEach(
        entry => {
          const rect =
            entry.el.getBoundingClientRect()

          if (
            rect.bottom < -40 ||
            rect.top >
              window.innerHeight +
                40
          ) {
            return
          }

          const luminance =
            sampleElementBackground(
              entry.el
            )

          const onLight =
            entry.onLight
              ? luminance >
                LIGHT_LEAVE
              : luminance >
                LIGHT_ENTER

          if (
            entry.onLight ===
              onLight &&
            Math.abs(
              entry.luminance -
                luminance
            ) < 0.012
          ) {
            return
          }

          entry.onLight =
            onLight

          entry.luminance =
            luminance

          entry.setState({
            onLight,
            luminance,
          })
        }
      )
    }, [])

  const requestSample =
    useCallback(() => {
      if (raf.current) {
        return
      }

      raf.current =
        window.requestAnimationFrame(
          () => {
            raf.current = 0
            sampleAll()
          }
        )
    }, [sampleAll])

  const register =
    useCallback(
      (
        el: HTMLElement,
        setState: GlassSetter
      ) => {
        const id =
          ++uid.current

        const luminance =
          sampleElementBackground(
            el
          )

        const onLight =
          luminance >
          LIGHT_ENTER

        entries.current.set(
          id,
          {
            el,
            setState,
            onLight,
            luminance,
          }
        )

        setState({
          onLight,
          luminance,
        })

        return () => {
          entries.current.delete(
            id
          )
        }
      },
      []
    )

  useEffect(() => {
    const update =
      () => requestSample()

    window.addEventListener(
      'scroll',
      update,
      {
        passive: true,
        capture: true,
      }
    )

    window.addEventListener(
      'resize',
      update
    )

    window.addEventListener(
      'load',
      update
    )

    document.addEventListener(
      'load',
      update,
      true
    )

    /*
     * One lightweight fallback timer
     * for all registered controls.
     */
    const interval =
      window.setInterval(
        requestSample,
        600
      )

    return () => {
      window.removeEventListener(
        'scroll',
        update,
        true
      )

      window.removeEventListener(
        'resize',
        update
      )

      window.removeEventListener(
        'load',
        update
      )

      document.removeEventListener(
        'load',
        update,
        true
      )

      window.clearInterval(
        interval
      )

      if (raf.current) {
        cancelAnimationFrame(
          raf.current
        )
      }
    }
  }, [requestSample])

  const value = useMemo(
    () => ({
      register,
      requestSample,
    }),
    [
      register,
      requestSample,
    ]
  )

  return (
    <AdaptiveGlassContext.Provider
      value={value}
    >
      {children}
    </AdaptiveGlassContext.Provider>
  )
}

export function useAdaptiveGlass() {
  const context =
    useContext(
      AdaptiveGlassContext
    )

  if (!context) {
    throw new Error(
      'useAdaptiveGlass must be used inside AdaptiveGlassProvider'
    )
  }

  const ref =
    useRef<HTMLElement | null>(
      null
    )

  const [sense, setSense] =
    useState<AdaptiveGlassSense>({
      onLight: false,
      luminance: 0.2,
    })

  useLayoutEffect(() => {
    if (!ref.current) {
      return
    }

    return context.register(
      ref.current,
      setSense
    )
  }, [context])

  return {
    ref,
    sense,
    requestSample:
      context.requestSample,
  }
}
