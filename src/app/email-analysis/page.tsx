"use client";

import { useEffect, useState } from "react";
import EmailAnalysisLayout from "./EmailAnalysisLayout";

interface Email {
  id: number;
  sample_id: number;
  text: string;
  explanations: { type: string; value: string }[];
}

interface Response {
  emailId: number | undefined;
  isPhishing: boolean;
  explanationType: string | undefined;
}

export default function EmailAnalysis() {
  const [email, setEmail] = useState<Email | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [currentSampleId, setCurrentSampleId] = useState(1);
  const [selectedExplanation, setSelectedExplanation] = useState<{
    type: string;
    value: string;
  } | null>(null);
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);

  const fetchEmail = (sampleId: number) => {
    fetch(`/api/emails?sampleId=${sampleId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const emailIndex = emailCount % 10;
          const currentEmail = data[emailIndex];

          if (currentEmail) {
            const explanations = [
              { type: "llama_shap_explanation", value: currentEmail.llama_shap_explanation },
              { type: "llama_lime_explanation", value: currentEmail.llama_lime_explanation },
              { type: "llama_combined_explanation", value: currentEmail.llama_combined_explanation },
              { type: "llama_raw_explanation", value: currentEmail.llama_raw_explanation },
            ].filter((explanation) => explanation.value);

            setEmail({
              id: currentEmail.id,
              sample_id: currentEmail.sample_id,
              text: currentEmail.text,
              explanations,
            });

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
    const response: Response = {
      emailId: email?.id,
      isPhishing,
      explanationType: selectedExplanation?.type,
    };

    setResponses((prevResponses) => [...prevResponses, response]);

    setEmailCount((prev) => {
      const nextCount = prev + 1;

      if (nextCount % 10 === 0) {
        setShowFinishPrompt(true);
      } else {
        if (nextCount % 10 === 0) {
          setCurrentSampleId((prevSampleId) => prevSampleId + 1);
        }
      }

      return nextCount;
    });
  };

  const handleContinue = () => {
    setShowFinishPrompt(false);
    fetchEmail(currentSampleId);
  };

  const handleFinish = () => {
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      // Insert into survey table
      const surveyResponse = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completion_date: new Date().toISOString(),
          comment: suggestion,
          rating,
        }),
      });

      if (!surveyResponse.ok) {
        throw new Error("Failed to insert survey data");
      }

      const surveyData = await surveyResponse.json();
      const surveyId = surveyData.id;

      // Insert into answers table
      for (const response of responses) {
        await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            survey_id: surveyId,
            email_id: response.emailId,
            type_explanation: response.explanationType,
            is_phishing: response.isPhishing,
          }),
        });
      }

      alert("Thank you for your feedback!");
      setShowFeedbackForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (!email && !showFinishPrompt) {
    return <p>No more emails available for analysis.</p>;
  }

  if (showFeedbackForm) {
    return (
      <div className="margin-top-8 text-center">
        <p className="text-lg">Thank you for your collaboration!</p>
        <div className="margin-top-4">
          <label>
            <p>How much do you think the explanations helped in your decision-making? (1 to 5)</p>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="input block mx-auto"
            />
          </label>

          <label className="margin-top-4 block">
            <p>What would you like to be added to the explanation?</p>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="textarea block mx-auto"
              rows={3}
            />
          </label>
        </div>

        <button
          className="button primary block margin-top-6 mx-auto"
          onClick={handleSubmitFeedback}
        >
          Submit Data
        </button>
      </div>
    );
  }

  if (showFinishPrompt) {
    return (
      <div className="margin-top-8">
        <p>Thanks for your collaboration!</p>
        <p>If you want to continue, click "Continue", otherwise click "Finish".</p>

        <div className="grid gap-4 margin-top-4">
          <button className="button primary" onClick={handleContinue}>
            Continue
          </button>
          <button className="button error" onClick={handleFinish}>
            Finish
          </button>
        </div>
      </div>
    );
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
