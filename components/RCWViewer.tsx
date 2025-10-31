export default function RCWViewer({ html }: { html: string }) {
  return (
    <section
      className="mt-6 leading-relaxed prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
