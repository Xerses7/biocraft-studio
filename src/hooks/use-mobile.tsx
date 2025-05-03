import * as React from "react"

// Define breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 640,   // sm
  tablet: 768,   // md
  desktop: 1024, // lg
  wide: 1280,    // xl
}

// Hook to detect mobile screens
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to check window width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.tablet)
    }
    
    // Check initial value
    checkMobile()
    
    // Setup media query listener with specific mobile breakpoint
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet - 1}px)`)
    
    // Modern event listener pattern
    const onChange = () => checkMobile()
    mql.addEventListener("change", onChange)
    
    // Cleanup
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Hook to detect tablet screens
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop)
    }
    
    checkTablet()
    
    const mql = window.matchMedia(
      `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`
    )
    
    const onChange = () => checkTablet()
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

// Hook for more granular responsive design
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop' | 'wide' | undefined>(
    undefined
  )

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < BREAKPOINTS.mobile) {
        setBreakpoint('mobile')
      } else if (width < BREAKPOINTS.tablet) {
        setBreakpoint('mobile')
      } else if (width < BREAKPOINTS.desktop) {
        setBreakpoint('tablet')
      } else if (width < BREAKPOINTS.wide) {
        setBreakpoint('desktop')
      } else {
        setBreakpoint('wide')
      }
    }
    
    checkBreakpoint()
    
    // Use resize event for more precise tracking
    window.addEventListener('resize', checkBreakpoint)
    
    return () => {
      window.removeEventListener('resize', checkBreakpoint)
    }
  }, [])

  return breakpoint
}