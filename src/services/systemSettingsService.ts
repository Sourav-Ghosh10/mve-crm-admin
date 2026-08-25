import api from "./api";

const systemSettingsService = {
    getSettings: async () => {
        const response = await api.get("/system-settings");
        return response.data.data;
    },

    getSettingByKey: async (key: string) => {
        const response = await api.get(`/system-settings/${key}`);
        return response.data.data;
    },

    updateSetting: async (data: { key: string; value: any; description?: string }) => {
        const response = await api.post("/system-settings", data);
        return response.data.data;
    },
};

export default systemSettingsService;
