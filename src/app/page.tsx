"use client"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="">
      <article className="">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome</h1>

          <p className="text-lg mb-8">
            This project is designed to evaluate whether artificial intelligence (AI) can help users accurately detect if an email is considered phishing or not. 
            Our goal is to provide the necessary tools to reduce the effectiveness of phishing emails.
          </p>

          <div className="w-full max-w-md">

            <h2 className="text-2xl font-semibold mt-6">What we ask you to do:</h2>
            <p className="mt-2">
              We ask you to review emails and determine whether, in your opinion, they are phishing or not. 
              We will also provide an AI-generated explanation to help with your decision. If no explanation is provided, simply base your judgment on the content of the email.
            </p>

            <h2 className="text-2xl font-semibold mt-6">What is a phishing email:</h2>
            <p className="mt-2">
              A phishing email is a fraudulent message designed to trick you into sharing sensitive information, like passwords or credit card details. 
              It often pretends to be from a trusted source and may include urgent requests, suspicious links, or fake sender addresses. Always be cautious and verify before clicking or sharing anything.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mt-6">Disclaimer</h2>
            <p className="mt-2 text-red-600 font-semibold">
              All emails shown on this page may be considered phishing. 
              Please do not click on any links or attempt to contact any senders mentioned.
              This content is for research purposes only.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="disclaimer"
                checked={accepted}
                onChange={() => setAccepted(!accepted)}
              />
              <label htmlFor="disclaimer" className="text-sm">
                I have read and agree to the disclaimer above.
              </label>
            </div>


          <Link href={accepted ? "/email-analysis" : "#"}>
            <button
              className={`mt-6 px-4 py-2 rounded ${
                accepted
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
              disabled={!accepted}
            >
              Let's Start!
            </button>
          </Link>
        </div>
      </article>
    </div>
  );
}

