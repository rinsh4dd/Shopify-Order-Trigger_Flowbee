const API_URL = "https://flowb.io/flowbee/SendWhatsappTemplate";
const API_KEY = "5BA5FABF-8885-4C87-B169-2EE6F06187F4";

async function sendWhatsappTemplate() {
  const payload = {
    company: "",
    phoneno: "917994350100",
    templatE_ID: "YOUR_NEW_TEMPLATE_ID", // Replace with your newly created template ID

    section: [
      {
        section: "body",
        parameter: [
          { type: "text", name: "1", value: "Test Customer" },
          { type: "text", name: "2", value: "1005" },
          { type: "text", name: "3", value: "Hydrogen Snowboard" },
          { type: "text", name: "4", value: "1" },
          { type: "text", name: "5", value: "600.00" },
          { type: "text", name: "6", value: "Created" }
        ]
      }
    ],

    to: [
      {
        number: "917909147518",
        sessioN_ID: 0,
        parameter: [
          { coL_KEY: "1", coL_VAL: "Test Customer" },
          { coL_KEY: "2", coL_VAL: "1005" },
          { coL_KEY: "3", coL_VAL: "Hydrogen Snowboard" },
          { coL_KEY: "4", coL_VAL: "1" },
          { coL_KEY: "5", coL_VAL: "600.00" },
          { coL_KEY: "6", coL_VAL: "Created" }
        ]
      }
    ]
  };

  try {
    console.log("Sending 6-variable template payload to flowb.io...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response Body:", text);
  } catch (error) {
    console.error("Request failed:", error);
  }
}

sendWhatsappTemplate();
