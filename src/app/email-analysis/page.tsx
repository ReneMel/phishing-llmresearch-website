"use client";

import { useEffect, useState } from "react";
import EmailAnalysisLayout from "./EmailAnalysisLayout";
import { Rating } from "react-simple-star-rating";
import { useRouter } from "next/navigation"; // Importa useRouter para redireccionar


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

  // Captura el rating
  const handleRating = (rate: number) => {
    setRating(rate);
  };

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
    if (emailCount > 0 && emailCount % 10 === 0) {
      setShowFinishPrompt(true);
    }
  }, [emailCount]);
  
  useEffect(() => {
    if (!showFinishPrompt) {
      fetchEmail(currentSampleId);
    }
  }, [currentSampleId]);
  
  // const handleResponse = (isPhishing: boolean) => {
  //   const response: Response = {
  //     emailId: email?.id,
  //     isPhishing,
  //     explanationType: selectedExplanation?.type,
  //   };
  
  //   setResponses((prevResponses) => [...prevResponses, response]);
  
  //   setEmailCount((prev) => prev + 1);
  // };

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
        // 🔥 Llamamos a fetchEmail con el mismo currentSampleId si no hemos completado 10 emails
        fetchEmail(currentSampleId);
      }
  
      return nextCount;
    });
  };
  
  
  const handleContinue = () => {
    setShowFinishPrompt(false);
    setCurrentSampleId((prevSampleId) => {
      console.log(`Changing sample ID from ${prevSampleId} to ${prevSampleId + 1}`);
      return prevSampleId + 1;
    });
  };
  
  //   const handleResponse = (isPhishing: boolean) => {
  //     const response: Response = {
  //       emailId: email?.id,
  //       isPhishing,
  //       explanationType: selectedExplanation?.type,
  //     };
    
  //     setResponses((prevResponses) => [...prevResponses, response]);
    
  //     setEmailCount((prev) => {
  //       const nextCount = prev + 1;
      
  //       if (nextCount % 10 === 0) {
  //         setShowFinishPrompt(true);
          
  //         // 🔥 Aseguramos que incrementa de 1 en 1
  //         setCurrentSampleId((prevSampleId) => {
  //           console.log(`Changing sample ID from ${prevSampleId} to ${prevSampleId + 1}`);
  //           return prevSampleId + 1;
  //         });
  //       }
      
  //       return nextCount;
  //     });
  //   };
  

  // const handleContinue = () => {
  //   setShowFinishPrompt(false);
  //   fetchEmail(currentSampleId);
  // };

  const handleFinish = () => {
    setShowFeedbackForm(true);
  };

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
  
      // ✅ Muestra un mensaje de BeerCSS (snackbar)
      // const snackbar = document.createElement("div");
      // snackbar.className = "snackbar show"; // Aplica la clase de BeerCSS
      // snackbar.textContent = "Thank you for your feedback!";
      // document.body.appendChild(snackbar);
  
      // // ✅ Elimina el mensaje después de 2 segundos y redirige a "/"
      // setTimeout(() => {
      //   snackbar.classList.remove("show");
      //   setTimeout(() => {
      //     snackbar.remove();
      //     router.push("/"); // Redirección a "/"
      //     // setShowFeedbackForm(false);
      //   }, 500); // Permite la animación antes de eliminarlo
      // }, 2000);
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

    <div
      className="flex column gap-3"
      style={{
        display: "flex",
        
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginTop: "1rem",
      }}
    >
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
        explanationText={selectedExplanation?.value || "No explanation available"}
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
  