"use client";

import { useEffect, useState } from "react";
import EmailAnalysisLayout from "./EmailAnalysisLayout";
import { Rating } from "react-simple-star-rating";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [currentBatch, setCurrentBatch] = useState<Email[]>([]);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [email, setEmail] = useState<Email | null>(null);
  const [usedSampleIds, setUsedSampleIds] = useState<number[]>([]);
  const [maxSampleId, setMaxSampleId] = useState<number | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<{ type: string; value: string } | null>(null);
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);

  const handleRating = (rate: number) => setRating(rate);

  useEffect(() => {
    const fetchMaxSampleId = async () => {
      const response = await fetch("/api/emails/max-sample-id");
      const data = await response.json();
      console.log("Max Sample ID fetched:", data.maxSampleId);
      setMaxSampleId(data.maxSampleId);
    };

    fetchMaxSampleId();
  }, []);

  useEffect(() => {
    if (maxSampleId !== null) {
      fetchNextGroup();
    }
  }, [maxSampleId]);

  const getNextSampleId = (): number | null => {
    if (maxSampleId === null) return null;

    const availableSampleIds = Array.from({ length: maxSampleId }, (_, i) => i + 1).filter(id => !usedSampleIds.includes(id));
    if (availableSampleIds.length === 0) return null;

    let randomSampleId: number | null = null;

    while (true) {
      const candidate = Math.floor(Math.random() * maxSampleId) + 1;
      if (!usedSampleIds.includes(candidate)) {
        randomSampleId = candidate;
        break;
      }
    }

    setUsedSampleIds(prev => [...prev, randomSampleId!]);
    return randomSampleId;
  };

  const fetchNextGroup = () => {
    const nextSampleId = getNextSampleId();
    if (nextSampleId !== null) {
      fetchEmailBatch(nextSampleId);
    } else {
      setEmail(null); // Ya no hay más sampleIds disponibles
    }
  };

  const fetchEmailBatch = async (sampleId: number) => {
    const response = await fetch(`/api/emails?sampleId=${sampleId}`);
    const data = await response.json();

    if (data.length > 0) {
      // Aleatorizar 30% sin explicación
      const numWithoutExplanation = Math.floor(data.length * 0.3);
      const indicesToHide = new Set<number>();
      while (indicesToHide.size < numWithoutExplanation) {
        indicesToHide.add(Math.floor(Math.random() * data.length));
      }

      const processedBatch = data.map((email: any, index: number) => {
        const explanations = [
          { type: "llama_shap_explanation", value: email.llama_shap_explanation },
          { type: "llama_lime_explanation", value: email.llama_lime_explanation },
          { type: "llama_combined_explanation", value: email.llama_combined_explanation },
          { type: "llama_raw_explanation", value: email.llama_raw_explanation },
        ].filter(e => e.value);

        return {
          id: email.id,
          sample_id: email.sample_id,
          text: email.text,
          explanations: indicesToHide.has(index) ? [] : explanations,
        };
      });

      setCurrentBatch(processedBatch);
      setCurrentEmailIndex(0);
      setEmail(processedBatch[0]);
      setSelectedExplanation(processedBatch[0].explanations.length > 0
        ? processedBatch[0].explanations[Math.floor(Math.random() * processedBatch[0].explanations.length)]
        : null);
    } else {
      setEmail(null);
    }
  };

  const handleResponse = (isPhishing: boolean) => {
    const response: Response = {
      emailId: email?.id,
      isPhishing,
      explanationType: selectedExplanation ? selectedExplanation.type : "no_explanation", // 🔥 Aquí está la clave
    };
  
    setResponses(prev => [...prev, response]);
  
    const nextIndex = currentEmailIndex + 1;
  
    if (nextIndex < currentBatch.length) {
      const nextEmail = currentBatch[nextIndex];
      setCurrentEmailIndex(nextIndex);
      setEmail(nextEmail);
      setSelectedExplanation(nextEmail.explanations.length > 0
        ? nextEmail.explanations[Math.floor(Math.random() * nextEmail.explanations.length)]
        : null);
    } else {
      setShowFinishPrompt(true);
    }
  };
  

  const handleContinue = () => {
    setShowFinishPrompt(false);
    fetchNextGroup();
  };

  const handleFinish = () => setShowFeedbackForm(true);

  const handleSubmitFeedback = async () => {
    try {
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

      router.push("/confirmation");
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (!email && !showFinishPrompt) {
    return <p>No more emails available for analysis.</p>;
  }

  if (showFeedbackForm) {
    return (
      <div className="center absolute fill">
        <div className="card p-6 elevation-3 max-w-600 w-100 text-center">
          <p className="text-2xl mb-4">Thank you for your collaboration!</p>
  
          {/* Rating Selection */}
          <div className="mb-6">
            <label className="block text-lg mb-2">
              How much do you think the explanations helped in your decision-making?
            </label>
            <div className="rating-container">
              <Rating
                onClick={handleRating}
                initialValue={rating}
                size={30}
                allowFraction
              />
            </div>
          </div>
  
          {/* Feedback Text Area */}
          <div className="mb-6">
            <label className="block text-lg mb-2">
              What would you like to be added to the explanation?
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="textarea block mx-auto text-lg w-100 max-w-500"
              rows={4}
              placeholder="Write your feedback here..."
            />
          </div>
  
          {/* Submit Button */}
          <button
            className="button primary large block mx-auto"
            onClick={handleSubmitFeedback}
            disabled={rating === 0}
          >
            Submit Feedback
          </button>
        </div>
      </div>
    );
  }
  

  if (showFinishPrompt) {
    return (
      <div className="center absolute fill">
        <div className="card p-6 elevation-3 max-w-400 text-center ">
          <h4 className="mb-2">Thank you for your help!</h4>
          <p className="mb-4">If you want to continue answering, click "Continue", otherwise click "Finish".</p>

          <div className="flex column gap-3">
            <button className="w-75 button primary" onClick={handleContinue}>
              Continue
            </button>
            <button className="w-75 button error" onClick={handleFinish}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <EmailAnalysisLayout
        emailNumber={email?.id || 0}
        emailText={email?.text || "No email available"}
        explanationText={selectedExplanation?.value || "En este caso no hay explicación. Solicitamos que mediante su conocimiento decida si es phishing o no."}
      />

      <div className="grid gap-4 margin-top-8">
        <button className="button success block" onClick={() => handleResponse(false)}>
          Not Phishing
        </button>

        <button className="button error block" onClick={() => handleResponse(true)}>
          Phishing
        </button>
      </div>
    </>
  );
}
