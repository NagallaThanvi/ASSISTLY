import React from 'react';
import { Fade, Slide } from '@mui/material';

// Simple wrapper to apply a page-level transition on mount
// Usage: <PageTransition type="fade|slide" direction="up|down|left|right" timeout={400}>...</PageTransition>
export default function PageTransition({ children, type = 'fade', direction = 'up', timeout = 400 }) {
  const [inProp, setInProp] = React.useState(false);

  React.useEffect(() => {
    // Defer to next tick for smoother mount
    const id = requestAnimationFrame(() => setInProp(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const content = (
    <div style={{ width: '100%' }}>
      {children}
    </div>
  );

  if (type === 'slide') {
    return (
      <Slide in={inProp} direction={direction} timeout={timeout} mountOnEnter unmountOnExit>
        {content}
      </Slide>
    );
  }

  return (
    <Fade in={inProp} timeout={timeout}>
      {content}
    </Fade>
  );
}
