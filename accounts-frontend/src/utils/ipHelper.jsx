import axios from "axios";

const GetIPAddress = async () => {
  try {
    // Make a GET request to ipify API to get the user's IP address
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip; // Return the IP address
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return null; // Return null if there's an error
  }
};

export default GetIPAddress;
