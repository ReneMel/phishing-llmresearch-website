import EmailAnalysisLayout from "./EmailAnalysisLayout";

export default function EmailAnalysis() {
  return (
    <EmailAnalysisLayout
      emailNumber={1}
      emailText="This is a sample email text."
      explanationText="This email could be suspicious due to..."
    />
  );
}
