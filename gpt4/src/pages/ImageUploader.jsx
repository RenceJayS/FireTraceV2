import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/topbar";
import ReactMarkdown from "react-markdown";  // << NEW IMPORT

import dropImageIcon from "../assets/drop-image-icon.png";
import "../styles/upload.css";
  

const getGPTPrompt = (imageUrl) => {
  return [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `You are an AI Fire Risk Analyst evaluating the fire vulnerability of a Philippine residential house based on its exterior image.
Follow the Fire Code of the Philippines (RA 9514), the National Building Code (PD 1096), and the Philippine Electrical Code — but focus strictly on residential dwelling applications such as materials, spacing, wiring, and visible hazards.

You must classify the house into one of the following:
🟩 Green – Low Fire Risk  
🟨 Yellow – Moderate Fire Risk  
🟥 Red – High Fire Risk  

Always provide a confident and clear classification. Focus 90% on the structure and materials, and 10% on visible hazards. Do not provide generic guidance or uncertainty.

──────────────────────────────
🔹 Residential Fire Risk Assessment Criteria (Simplified for Philippine Homes)

1. **Building Materials (PD 1096 Sec. 601–604)**  
   🟩 Reinforced concrete, hollow blocks, metal roof — non-combustible.  
   🟨 Mix of concrete and wood — partly combustible.  
   🟥 Mostly wood, bamboo, or light panels — highly combustible.

2. **Spacing and Firewalls (RA 9514 Rule 10 Sec. 10.2.6.1)**  
   🟩 With firewall or ≥3 m spacing.  
   🟨 Partial firewall or 1–3 m spacing.  
   🟥 No firewall or directly attached to other houses.

3. **Electrical Safety (RA 9514 Sec. 13.0.0.0; PEC Art. 3.10, 2.10)**  
   🟩 Enclosed, organized wiring.  
   🟨 Minor exposed but organized wiring.  
   🟥 Tangled, overloaded, or illegal connections.

4. **Roof and Openings (PD 1096 Sec. 604; RA 9514 Rule 10)**  
   🟩 Concrete or metal roof intact.  
   🟨 Rusty or patched roofing.  
   🟥 Makeshift or wooden roofing with gaps.

5. **Outdoor Clutter (RA 9514 Rule 10 Sec. 10.2.9.1)**  
   🟩 Clear surroundings.  
   🟨 Some flammable materials but organized.  
   🟥 Debris, trash, or LPG tanks near walls or heat.

6. **Access and Exits (RA 9514 Rule 13 Sec. 13.0.0.2)**  
   🟩 Wide and unobstructed access roads.  
   🟨 Narrow but passable.  
   🟥 Congested or blocked.  
   ⚠️ *If no road is visible in the image, skip this category.*

7. **Ignition Sources (RA 9514 Rule 10 Sec. 10.2.9.1; PEC Art. 4.00)**  
   🟩 No visible ignition sources.  
   🟨 Secured LPG tanks.  
   🟥 Unsecured LPG, stoves, or open flames outdoors.

──────────────────────────────
🔸 STRICT OUTPUT FORMAT  
Respond only with this exact structure — clear, organized, and easy to read.

**Fire Risk Level:** high / moderate / low  

**Observed Fire Hazards:**  
• **Building Materials:** [clear factual observation]  
• **Electrical Infrastructure:** [observation]  
• **Proximity to Other Structures:** [observation]  
• **Clutter and Debris:** [observation]  
• **Roof Access and Condition:** [observation]  
• **Nearby Fire Hazards:** [observation]  
(If visible, also include **Access and Exits:** [observation]. Otherwise, omit.)  

**Recommendations:**  
• **Electrical Safety:** [actionable recommendation]  
• **Structural Modifications:** [actionable recommendation]  
• **Clutter Management:** [actionable recommendation]  

**Detected Fire Risk Level:** [Green / Moderate / High — in uppercase and bold if supported]

Maintain consistent spacing, bullet alignment, and clear line breaks.  
Do not include disclaimers, or uncertainty.`,
        },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ],
    },
  ];
};


const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
    const [showPopup, setShowPopup] = useState(true); // ✅ Popup state


  const streetOptions = [
    "P. Zamora Street",
    "D. Reyes Street",
    "Innocencio Street",
    "Tramo Street",
  ];

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(selected);

    setFile(selected);
    setResult("");
    setIsValid(null);
    setRiskLevel(null);
  };

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/dlmrcsaqf/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    formData.append("folder", "firetrace_uploads");

    try {
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url || null;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return null;
    }
  };

  const geocodeAddress = async (address) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key missing.");
      return null;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.status === "OK" ? data.results[0].geometry.location : null;
    } catch (err) {
      console.error("Geocode error:", err);
      return null;
    }
  };
const sendDataToBackend = async (imageUrl, address, coords, riskLevel, gptResult, street, houseNumber, file) => {
  console.log("🚀 Sending to backend:", { street, houseNumber }); // Debug log

  const user = JSON.parse(localStorage.getItem("user"));
  
  try {
    const response = await fetch("http://localhost:5000/api/house-risk/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        address,
        coordinates: coords,
        riskLevel,
        gptResult,
        street,        // ✅ Must be a string (not null)
        houseNumber,   // ✅ Must be a string or number
        imageType: file?.type || "unknown",
        uploadedBy: user?.id,
      }),
    });

    if (!response.ok) {
      console.error("Failed to save data:", await response.text());
    }
  } catch (error) {
    console.error("Backend error:", error);
  }
};

   


  const handleSubmit = async () => {
    if (!file) {
      setResult("Please upload an image first.");
      return;
    }
    if (!street.trim() || !houseNumber.trim()) {
      setResult("Please enter both Street and House Number.");
      return;
    }

    setLoading(true);
    setResult("");
    setIsValid(null);
    setRiskLevel(null);

    try {
      const modelURL = "https://teachablemachine.withgoogle.com/models/9c9PP3bDX/";
      const modelJson = modelURL + "model.json";
      const metadataJson = modelURL + "metadata.json";

      if (!window.tmImage) {
        setResult("Teachable Machine library not loaded.");
        setLoading(false);
        return;
      }

      const model = await window.tmImage.load(modelJson, metadataJson);
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          resolve();
        };
        img.onerror = () => reject(new Error("Image load error"));
      });

      const prediction = await model.predict(img);
      const valid = prediction.find((p) =>
        p.className.toLowerCase().includes("valid")
      );

      if (!(valid && valid.probability > 0.8)) {
        setIsValid(false);
        setResult("Invalid image. Upload a clear house exterior.");
        setLoading(false);
        return;
      }

      setIsValid(true);
      const address = `${houseNumber} ${street}, Barangay 105 Zone 11, Pasay City, Philippines`;
      const coords = await geocodeAddress(address);

      if (!coords) {
        setResult("Could not resolve address. Check your inputs.");
        setLoading(false);
        return;
      }

      const imageUrl = await uploadToCloudinary(file);
      if (!imageUrl) {
        setResult("Failed to upload image.");
        setLoading(false);
        return;
      }

      await sendToGPT(imageUrl, address, coords);
    } catch (error) {
      console.error("Error during submission:", error);
      setResult("Error analyzing image.");
    } finally {
      setLoading(false);
    }
  };

  const sendToGPT = async (imageUrl, address, coords) => {
    const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!openaiKey) {
      console.error("OpenAI API key missing.");
      setResult("OpenAI key not found.");
      return;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: getGPTPrompt(imageUrl, address, coords),
        }),
      });

      const data = await res.json();
      const message = data.choices?.[0]?.message?.content || "No response from GPT.";
      setResult(message);

      const level = /Green/i.test(message)
        ? "LOW"
        : /Yellow/i.test(message)
        ? "MODERATE"
        : /Red/i.test(message)
        ? "HIGH"
        : null;

      setRiskLevel(level);
      await sendDataToBackend(imageUrl, address, coords, level, message);
    } catch (err) {
      console.error("GPT API error:", err);
      setResult("Failed to get GPT analysis.");
    }
  };

  const handleScanAgain = () => {
    setImage(null);
    setFile(null);
    setResult("");
    setIsValid(null);
    setRiskLevel(null);
    setStreet("");
    setHouseNumber("");
  };

  const formatGPTText = (text) => {
  if (!text) return "";
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        !/(fire risk level|risk level|detected risk)/i.test(line) && line.length > 0
    );

  const html = lines.map((line) => {
    // Remove numbering or bullet characters at the start
    const cleanLine = line.replace(/^(?:\d+\.|\-|\*|•)\s+/, "");

    // If line looks like a list item (starts with bullet or number), treat as list item without numbering
    if (/^(?:\d+\.|\-|\*|•)\s+/.test(line)) {
      return `<li>${cleanLine}</li>`;
    }
    // Otherwise normal paragraph
    else {
      return `<p>${cleanLine}</p>`;
    }
  });

  const listItems = html.filter((l) => l.startsWith("<li>"));
  const otherItems = html.filter((l) => !l.startsWith("<li>"));

  return (
    `<div class="gpt-output-block">` +
    otherItems.join("") +
    (listItems.length ? `<ul class="gpt-output-list">${listItems.join("")}</ul>` : "") +
    `</div>`
  );
};

 const riskColors = {
  LOW: "green",
  MODERATE: "orange",
  HIGH: "red",
};

return (
<div className="imageupload-container">
      <Sidebar />
      <div className="content-area">
        <div className="upload-container">
          <main className="main-content" style={{ width: "100%" }}>
            <div
              className="upload-layout"
              style={{ height: "650px", display: "flex", gap: "3rem" }}
            >
              <div className="upload-box" tabIndex={0}>
                <label
                  htmlFor="imageUpload"
                  className="upload-label full-box"
                  style={{ cursor: "pointer" }}
                >
                  {image ? (
                    <div className="image-preview-wrapper full-box" tabIndex={-1}>
                      <img
                        src={image}
                        alt="Preview"
                        className="image-preview full-box"
                      />
                      <p className="upload-note overlay-note">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="upload-icon-wrapper full-box" tabIndex={-1}>
                      <img
                        src={dropImageIcon}
                        alt="Upload"
                        className="upload-icon"
                      />
                      <p>Upload or Drag and Drop</p>
                      <p className="upload-note">
                        Use exterior house photos only
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="imageUpload"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="form-section" aria-live="polite">
                {loading && !result ? (
                  <div className="loading-spinner-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Analyzing image...</p>
                  </div>
                ) : !result ? (
                  <>
                    <label htmlFor="houseNumber" className="form-label">
                      House Number:
                    </label>
                    <input
                      type="text"
                      id="houseNumber"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. 123"
                      autoComplete="off"
                      className="form-input1"
                    />

                    <label htmlFor="street" className="form-label">
                      Street:
                    </label>
                    <select
                      id="street"
                      className="form-input"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    >
                      <option value="">Select Street</option>
                      {streetOptions.map((streetOption) => (
                        <option key={streetOption} value={streetOption}>
                          {streetOption}
                        </option>
                      ))}
                    </select>

                    <button
                      className="scan-btn"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Analyzing..." : "Analyze Fire Risk"}
                    </button>

                    {isValid === false && (
                      <p className="validation-error">
                        Invalid image uploaded.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="result-area">
                    {result && (
                      <div
                        className={`result-text ${
                          riskLevel
                            ? `risk-${riskLevel.toLowerCase()}`
                            : ""
                        }`}
                      >
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </div>
                    )}

                    {riskLevel && (
                      <p
                        className="risk-level"
                        style={{
                          color: riskColors[riskLevel],
                          fontWeight: "bold",
                          marginTop: "1rem",
                        }}
                      >
                        Detected Fire Risk Level: {riskLevel}
                      </p>
                    )}

                    <button
                      className="scan-btn"
                      onClick={handleScanAgain}
                      style={{ marginTop: "1rem" }}
                    >
                      Scan Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Popup Modal */}
            {showPopup && (
              <div className="popup-overlay">
                <div className="popup-box">
                  <h2>FireTrace Scan Instructions</h2>

                  <ul>
                    <li><b>Show the house clearly -</b> Make sure the image is focused, not blurry.</li>
                    <li><b>Keep the camera level -</b> Hold your device straight, not tilted, for a clear and balanced view.</li>
                    <li><b>Use good lighting –</b> Capture during daytime with the light behind you.</li>
                    <li><b>Avoid filters or edits –</b> Upload only a real, unedited photo.</li>
                    <li><b>Ensure good quality –</b> Use a clear image with a good resolution.</li>
                    <li><b>File size limit –</b> Upload images less than <b>10 MB</b>.</li>
                    <li><b>Accepted file types –</b> Only JPG, JPEG, or PNG files are allowed.</li>


                  </ul>
                  <button
                    className="popup-btn1"
                    onClick={() => setShowPopup(false)}
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>

);
};

export default ImageUploader;
