import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = () => {
  const now = new Date()
  const timeStr = `${now.toString()}, millis: ${now.getMilliseconds()}`;
  return json({timeStr})
}

export default function Index() {
  const { timeStr }= useLoaderData<typeof loader>()
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <p>The time is {timeStr}</p>
    </div>
  );
}
