"use client";

import { useEffect, useState } from "react";
import EmailAnalysisLayout from "./EmailAnalysisLayout";

interface Email {
  id: number;
  sample_id: number;
  text: string;
  explanations: { type: string; value: string }[];
}

export default function EmailAnalysis() {
  const [email, setEmail] = useState<Email | null>(null);
  const [emailCount, setEmailCount] = useState(0); // Track emails within the block
  const [currentSampleId, setCurrentSampleId] = useState(1);
  const [selectedExplanation, setSelectedExplanation] = useState<{
    type: string;
    value: string;
  } | null>(null);

  const fetchEmail = (sampleId: number) => {
    fetch(`/api/emails?sampleId=${sampleId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const emailIndex = emailCount % 10;
          const currentEmail = data[emailIndex];

          if (currentEmail) {
            const explanations = [
              { type: "shap", value: currentEmail.llama_shap_explanation },
              { type: "lime", value: currentEmail.llama_lime_explanation },
              { type: "combined", value: currentEmail.llama_combined_explanation },
              { type: "raw", value: currentEmail.llama_raw_explanation },
            ].filter((explanation) => explanation.value);

            setEmail({
              id: currentEmail.id,
              sample_id: currentEmail.sample_id,
              text: currentEmail.text,
              explanations,
            });

            // Randomly select an explanation
            const randomExplanation =
              explanations[Math.floor(Math.random() * explanations.length)];
            setSelectedExplanation(randomExplanation);
          } else {
            setEmail(null);
          }
        } else {
          setEmail(null);
        }
      });
  };

  useEffect(() => {
    fetchEmail(currentSampleId);
  }, [currentSampleId, emailCount]);

  const handleResponse = (isPhishing: boolean) => {
    console.log({
      emailId: email?.id,
      isPhishing,
      explanationType: selectedExplanation?.type,
    });

    // Update email count and switch sample block if needed
    setEmailCount((prev) => {
      let nextCount = prev + 1;
      if (nextCount % 10 === 0) {
        nextCount=1
        setCurrentSampleId((prevSampleId) => prevSampleId + 1);
      }
      return nextCount;
    });
  };

  if (!email) {
    return <p>No more emails available for analysis.</p>;
  }

  return (
    <>
      <EmailAnalysisLayout
        emailNumber={email.id}
        emailText={email.text}
        explanationText={selectedExplanation?.value || "No explanation available"}
      />

      <div className="grid gap-4 margin-top-8">
        <button
          className="button error block"
          onClick={() => handleResponse(true)}
        >
          Phishing
        </button>
        <button
          className="button success block"
          onClick={() => handleResponse(false)}
        >
          Not Phishing
        </button>
      </div>
    </>
  );
}
