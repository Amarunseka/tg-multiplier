export {};

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any; // можно описать точнее, но для начала any
        };
    }
}