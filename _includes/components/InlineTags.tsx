interface InlineTagsProps {
  tags?: string[];
}

export function InlineTags({ tags }: InlineTagsProps) {
  if (!tags || tags.length === 0) return null;
  return (
    <span>
      {" "}Tags:{" "}
      {tags.map((tag, i) => (
        <span key={tag}>
          <a href={`/tag/${tag.toLowerCase().replace(/ /g, "-")}.html`}>{tag}</a>
          {i < tags.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}
