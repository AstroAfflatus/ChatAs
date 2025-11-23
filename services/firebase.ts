export const firebaseConfig = {
  apiKey: "AIzaSyDY-b9am42T_YtTYpI6dzO2uwzNRcEh5DE",
  authDomain: "chatas-1.firebaseapp.com",
  databaseURL: "https://chatas-1-default-rtdb.firebaseio.com",
  projectId: "chatas-1",
  storageBucket: "chatas-1.firebasestorage.app",
  messagingSenderId: "574984329754",
  appId: "1:574984329754:web:ba7409229f06fd85e68fa3"
};

// ImgBB Upload Service
export const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  // Using the key provided in prompt
  const API_KEY = '57cedacd9e4d46f5a0ede22e77c7a57a'; 
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Image upload failed');
    }
  } catch (error) {
    console.error("ImgBB Error", error);
    throw error;
  }
};