
const ENV = {
    dev: {
        // apiUrl: () => {
        //     const host = Constants.expoConfig?.hostUri?.split(':').shift() || 'localhost';
        //     return `http://${host}:3000`;
        // }
        apiUrl: "https://67dc-2402-800-6130-6454-b4ff-3d59-4447-83b4.ngrok-free.app"
        //apiUrl: "https://urace-app-backend.onrender.com", 
        // apiUrl: "https://tenorless-phillip-fervently.ngrok-free.dev"
    }
}

const getEnvVars = () => {
    return ENV.dev;
}

export default getEnvVars;