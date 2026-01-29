document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('apiToken');
  const saveBtn    = document.getElementById('save');
  const status     = document.getElementById('status');
  const errorDiv   = document.getElementById('error');

  // Load previously saved token
  chrome.storage.local.get(['hfToken'], (result) => {
    if (result.hfToken) {
      tokenInput.value = result.hfToken;
    }
  });

  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
      errorDiv.textContent = 'Please enter a token.';
      status.textContent = '';
      return;
    }

    if (!token.startsWith('hf_')) {
      errorDiv.textContent = 'Token should start with "hf_".';
      status.textContent = '';
      return;
    }

    chrome.storage.local.set({ hfToken: token }, () => {
      status.textContent = 'Token saved successfully ✓';
      errorDiv.textContent = '';
    });
  });
});
