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
          text: `You are a fire risk analyst AI. Analyze the image of this house exterior and classify its fire risk as Green (Low), Yellow (Moderate), or Red (High) based on visual indicators. Focus primarily on the main house structure, not surrounding walls or fences, when evaluating construction materials. Do not let small non-flammable structures (like short fences or partial walls) affect the classification if the primary house is combustible. Avoid using words like “appears,” “may,” or “seems.” Only describe what is visibly observable with confident, direct statements.

Evaluate the structure and surroundings for the following fire hazards:
90% focus on the:
- Main building materials (wood, concrete and a mix of wood and concrete)

10% to the following:
- Exposed or messy electrical wiring
- Open gaps or poor ventilation
- Nearby structures with no firebreak
- Outdoor clutter (trash, tires, debris)
- Damaged or makeshift roofing
- Visible LPG tanks, stoves, or other ignition sources
- Limited or obstructed access for emergency responders

Return:
- The Fire Risk Level (Green, Yellow, or Red)
- A bulleted list of fire hazards observed using clear and factual language.
- Another bulleted list for Recommendations.


Refer to this criteria for analysis:
Fire Hazard Assessment Rubric for Exterior House Evaluation
1. Building Materials: Structures made of fire-resistant materials such as concrete, bricks, or metal roofing fall under the green category. Partial use of flammable materials like wood combined with concrete moderate risk (yellow), while use of highly combustible materials like wood, bamboo, nipa is considered high risk (red).
2. Electrical Infrastructure: Low-risk houses have neat, enclosed wiring with no visible power lines. If some wires are exposed or old but the area is generally tidy, the risk is moderate. Houses with tangled, exposed wiring or overloaded sockets fall into the high-risk category.
3. Ventilation and Openings: Green-level homes feature secure, screened openings. If vents are open or wooden windows are used without protection, the risk rises to moderate. Broken windows, structural gaps, or blocked airflow by flammable materials signal a high risk.
4. Proximity to Other Structures: A distance of more than three meters from neighboring buildings is low risk. If the house shares walls or is 1–3 meters away from others, it's moderately risky. Homes that are directly attached to others with no separation are highly vulnerable.
5. Clutter and Debris: Clear surroundings with no stored combustible items indicate low risk. If there's some clutter like cardboard or stored items but it's organized, the house is at moderate risk. High risk is assigned when there’s heavy outdoor clutter, debris, or combustible storage.
6. Roof Access and Condition: Homes with concrete or well-maintained metal roofing are considered low risk. Moderate risk applies if roofing is rusty or visibly patched. High risk involves makeshift materials like tarps or wood, or severely damaged roofs.
7. Nearby Fire Hazards: No visible fire sources or secured gas containers imply low risk. If grills or LPG tanks are present but properly stored, the house is moderately risky. Red-level risk includes visible, unsecured LPG tanks, stoves, or open flames near the house.
8. Accessibility for Emergency Response: Homes on wide, unobstructed roads are low risk. Those located in narrow but accessible alleys are moderate. If fire trucks cannot reach the property due to blocked paths or congestion, the risk is high.
9. Hazard Report Consistency (from crowdsourced data): Homes with no reported incidents are green. A few concerns from neighbors push it to yellow. Frequent reports or known past incidents place a house in the red category.

and give a doable 3 prescriptive analytics (Recommendations)`
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
                    <li><b>Ensure good quality –</b> Use a clear image with a good resolution</li>
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
