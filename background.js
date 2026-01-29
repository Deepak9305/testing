chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "check-ai-image",
    title: "Check if AI-Generated",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "check-ai-image" && info.srcUrl) {
    const imageUrl = info.srcUrl;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'AI Image Detector',
      message: 'Loading... Checking image.'
    });

    chrome.storage.local.get(['hfToken'], async (result) => {
      const token = result.hfToken;
      if (!token) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: 'AI Image Detector – Error',
          message: 'No Hugging Face API token found.\nPlease open the extension options and add your token.'
        });
        return;
      }

      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Cannot fetch image: ${response.status}`);
        const blob = await response.blob();

        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const apiResponse = await fetch(
          'https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: base64 })
          }
        );

        if (!apiResponse.ok) {
          const err = await apiResponse.json().catch(() => ({}));
          throw new Error(err.error || `API error ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        let aiProb = 0;
        let label = 'unknown';

        if (Array.isArray(data) && data.length > 0) {
          const top = data.reduce((a, b) => a.score > b.score ? a : b);
          aiProb = Math.round(top.score * 100);
          label = top.label.toLowerCase().includes('ai') ||
                  top.label.toLowerCase().includes('generated') ||
                  top.label.toLowerCase().includes('fake')
            ? 'likely AI-generated'
            : 'likely real / human-made';
        }

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: 'AI Image Detection Result',
          message: `AI probability: ${aiProb}%\nConclusion: ${label}\n\n(Note: Model is from 2022 – best for artistic images)`
        });

      } catch (err) {
        console.error(err);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: 'AI Image Detector – Error',
          message: `Could not analyze image:\n${err.message}`
        });
      }
    });
  }
});
