// Create the context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkAI",
    title: "Check if AI-Generated",
    contexts: ["image"]
  });
});

// Listen for the click on the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkAI") {
    const imageUrl = info.srcUrl;
    processImage(imageUrl);
  }
});

async function processImage(imageUrl) {
  // 1. Get the API Key from storage
  const data = await chrome.storage.local.get("hfToken");
  if (!data.hfToken) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "API Key Missing",
      message: "Please go to extension options and enter your Hugging Face Token."
    });
    return;
  }

  // 2. Show loading notification
  chrome.notifications.create("loading", {
    type: "basic",
    iconUrl: "icon.png",
    title: "Analyzing...",
    message: "Sending image to Hugging Face AI models."
  });

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector",
      {
        headers: { 
          "Authorization": `Bearer ${data.hfToken}`,
          "Content-Type": "application/json" 
        },
        method: "POST",
        body: JSON.stringify({ inputs: imageUrl }),
      }
    );

    const result = await response.json();
    chrome.notifications.clear("loading");

    // 3. Handle and display results
    if (result.error) throw new Error(result.error);

    // The model returns an array of objects: [{label: 'artificial', score: 0.9}, ...]
    const aiScore = result.find(item => item.label === "artificial")?.score || 0;
    const percentage = (aiScore * 100).toFixed(2);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Analysis Complete",
      message: `Probability this is AI: ${percentage}%`
    });

  } catch (error) {
    chrome.notifications.clear("loading");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Error",
      message: error.message || "Failed to scan image."
    });
  }
}
