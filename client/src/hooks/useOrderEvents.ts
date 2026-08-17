import { useEffect, useRef } from "react";

// Subscribes to the server's order-change stream so views can refresh
// immediately instead of waiting on the next poll or a manual refresh.
export function useOrderEvents(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = () => onChangeRef.current();
    return () => source.close();
  }, []);
}
