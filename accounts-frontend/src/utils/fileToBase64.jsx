export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error("Input must be a File object"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };

    reader.onerror = (error) => {
      reject(new Error("Failed to read file: " + error));
    };

    reader.readAsDataURL(file);
  });
};
