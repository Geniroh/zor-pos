import "./PlaceholderPage.css";

interface PlaceholderPageProps {
  title: string;
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>This section is coming soon.</p>
    </div>
  );
}

export default PlaceholderPage;
