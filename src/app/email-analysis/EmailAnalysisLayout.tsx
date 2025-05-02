interface EmailAnalysisProps {
  emailText: string;
  explanationText?: string;
}

export default function EmailAnalysisLayout({
  emailText,
  explanationText,
}: EmailAnalysisProps) {
  return (
    <div className="padding-8">
      <article className="card outlined padding-6">
        <h2 className="text-xl margin-bottom-4">Email Text</h2>

        <pre className="code">
          <code>{emailText}</code>
        </pre>

        {explanationText && (
          <>
            <h3 className="text-lg margin-top-4">Explanation:</h3>
            <pre className="code">
              <code>{explanationText}</code>
            </pre>
          </>
        )}
      </article>
    </div>
  );
}
