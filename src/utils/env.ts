export const getApiBaseUrl = (): string => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env) {
        return import.meta.env.VITE_API_URL || "/api";
    }
    return "/api";
};
