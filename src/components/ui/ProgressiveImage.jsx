import { useCallback, useState } from "react"

export default function ProgressiveImage({
  className = "",
  onError,
  onLoad,
  ...imageProps
}) {
  const imageSource = imageProps.src
  const [loadedSource, setLoadedSource] = useState("")
  const isLoaded = loadedSource === imageSource

  const setImageRef = useCallback((image) => {
    if (image?.complete) {
      setLoadedSource(imageSource)
    }
  }, [imageSource])

  const handleLoad = (event) => {
    setLoadedSource(imageSource)
    onLoad?.(event)
  }

  const handleError = (event) => {
    setLoadedSource(imageSource)
    onError?.(event)
  }

  return (
    <img
      {...imageProps}
      className={`${className} progressive-image${isLoaded ? " progressive-image-loaded" : ""}`.trim()}
      onError={handleError}
      onLoad={handleLoad}
      ref={setImageRef}
    />
  )
}
