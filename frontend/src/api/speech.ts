export async function transcribeSpeech(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  const res = await fetch('/api/speech', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Speech recognition failed: ${res.status}`);
  }

  const data = await res.json();
  return data.text;
}