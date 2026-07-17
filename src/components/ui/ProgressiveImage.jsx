import { useState } from "react"

export default function ProgressiveImage({
  className = "",
  onError,
  onLoad,
  ...imageProps
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  const handleLoad = (event) => {
    setIsLoaded(true)
    onLoad?.(event)
  }

  const handleError = (event) => {
    setIsLoaded(true)
    onError?.(event)
  }

  return (
    <img
      {...imageProps}
      className={`${className} progressive-image${isLoaded ? " progressive-image-loaded" : ""}`.trim()}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}
