import api from "./api";

export const paymentService = {
  async createCheckoutSession(payload) {
    const { data } = await api.post("/payments/checkout-session", payload);
    return data;
  },

  async getCheckoutSessionStatus(sessionId) {
    const { data } = await api.get(`/payments/checkout-session/${sessionId}`);
    return data;
  },

  async payForAppointment(payload) {
    const { data } = await api.post("/payments/pay", payload);
    return data;
  },

  async getMyPayments() {
    const { data } = await api.get("/payments/my");
    return data;
  },

  async getAllPayments() {
    const { data } = await api.get("/payments");
    return data;
  },

  async getPaymentByAppointment(appointmentId) {
    const { data } = await api.get(`/payments/appointment/${appointmentId}`);
    return data;
  }
};
