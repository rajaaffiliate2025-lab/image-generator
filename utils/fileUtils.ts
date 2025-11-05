
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader did not return a string.'));
      }
      
      const dataUrl = reader.result;
      const base64String = dataUrl.split(',')[1];
      
      if (!base64String) {
        return reject(new Error('Could not extract base64 string from file data URL.'));
      }

      resolve({ base64: base64String, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
}
