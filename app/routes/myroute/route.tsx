import { Link, useLoaderData } from '@remix-run/react'
import wallpaper from './wallpaper.jpg'
import { MetaFunction, json } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: "My route" },
    { name: "description", content: "A route with a wallpaper and timestamp" },
  ];
};

export const loader = () => {
  const now = new Date()
  const timeStr = `${now.toString()}, millis: ${now.getMilliseconds()}`;
  return json({ timeStr })
}

export default function MyRoute() {
  const { timeStr }= useLoaderData<typeof loader>()
  return (
    <div>
      <h1>hi</h1>
      <p>{timeStr}</p>
      <img src={wallpaper} alt="" />
      <Link to='/'>Go home</Link>
    </div>
  )
}
