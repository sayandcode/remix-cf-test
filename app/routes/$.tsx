import { useLocation } from "@remix-run/react";

export default function Index() {
  const { pathname}= useLocation()
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>You hit {pathname}</h1>
    </div>
  );
}
