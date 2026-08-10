const fallbackCrmUrl = "https://crm.uniodontopassos.com.br/login";
export const CRM_URL = import.meta.env.VITE_CRM_URL || fallbackCrmUrl;

const fallbackSalesAppUrl = "https://app.uniodontopassos.com.br/";
export const SALES_APP_URL = import.meta.env.VITE_SALES_APP_URL || fallbackSalesAppUrl;
