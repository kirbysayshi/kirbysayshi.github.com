export const handle = { classname: "page-404" };

export function meta() {
  return [{ title: "Not Found — KSH" }];
}

export default function NotFound() {
  return (
    <div className="lined-block col span_6">
      <h1>404 — Not Found</h1>
      <p>
        The page you were looking for doesn&apos;t exist.{" "}
        <a href="/">Go home.</a>
      </p>
    </div>
  );
}
