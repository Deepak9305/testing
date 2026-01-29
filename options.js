document.getElementById('save').addEventListener('click', () => {
  const token = document.getElementById('token').value;
  chrome.storage.local.set({ hfToken: token }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Token saved successfully!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// Load existing token if it exists
chrome.storage.local.get("hfToken", (data) => {
  if (data.hfToken) {
    document.getElementById('token').value = data.hfToken;
  }
});
