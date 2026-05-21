/**
 * Utility to compress and resize images on the client side before saving in LocalStorage.
 * Prevents exceeding LocalStorage limits (which are usually around 5MB).
 */
export function compressImage(file: File, maxSizeInput = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to fit within maxSize
        if (width > height) {
          if (width > maxSizeInput) {
            height = Math.round((height * maxSizeInput) / width);
            width = maxSizeInput;
          }
        } else {
          if (height > maxSizeInput) {
            width = Math.round((width * maxSizeInput) / height);
            height = maxSizeInput;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // Fallback to raw base64 if canvas context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to low weight JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
