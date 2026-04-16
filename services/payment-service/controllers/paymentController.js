const Payment = require("../models/Payment");

const STRIPE_CHECKOUT_METHOD = "STRIPE_CHECKOUT";
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf"
]);

let stripeClient = null;
let StripeConstructor = null;

const getStripeSecretKey = () => (process.env.STRIPE_SECRET_KEY || "").trim();
const getStripeWebhookSecret = () => (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

const hasStripeApiKeyFormat = (value = "") => /^(sk|rk)_(test|live)_/.test(value);
const hasStripeWebhookSecretFormat = (value = "") => /^whsec_/.test(value);

const getStripeConfigurationError = () => {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    return "Stripe is not configured for this environment";
  }

  if (secretKey.startsWith("pk_")) {
    return "STRIPE_SECRET_KEY is using a publishable key. Use your Stripe secret key (sk_test_... or sk_live_...).";
  }

  if (secretKey.startsWith("whsec_")) {
    return "STRIPE_SECRET_KEY is using a webhook signing secret. Use your Stripe secret key (sk_test_... or sk_live_...).";
  }

  if (!hasStripeApiKeyFormat(secretKey)) {
    return "STRIPE_SECRET_KEY is invalid. Use a Stripe secret or restricted API key.";
  }

  return "";
};

const getStripeWebhookConfigurationError = () => {
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    return "Stripe webhook secret is not configured";
  }

  if (webhookSecret.startsWith("pk_") || webhookSecret.startsWith("sk_") || webhookSecret.startsWith("rk_")) {
    return "STRIPE_WEBHOOK_SECRET is using an API key. Use a Stripe webhook signing secret (whsec_...).";
  }

  if (!hasStripeWebhookSecretFormat(webhookSecret)) {
    return "STRIPE_WEBHOOK_SECRET is invalid. Use a Stripe webhook signing secret (whsec_...).";
  }

  return "";
};

const getAppointmentServiceUrl = () =>
  (process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:4003").replace(/\/+$/, "");

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const isStripeConfigured = () => !getStripeConfigurationError();

const getStripeClient = () => {
  if (!isStripeConfigured()) {
    return null;
  }

  if (!StripeConstructor) {
    // Load Stripe lazily so non-Stripe routes still work when Stripe is not configured.
    // This avoids crashing the whole payment service on environments that use only mock payments.
    // eslint-disable-next-line global-require
    StripeConstructor = require("stripe");
  }

  if (!stripeClient) {
    stripeClient = new StripeConstructor(getStripeSecretKey());
  }

  return stripeClient;
};

const normalizeCurrency = (value = "LKR") => value.toString().trim().toLowerCase() || "lkr";

const toMinorUnitAmount = (amount, currency = "lkr") => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  return ZERO_DECIMAL_CURRENCIES.has(normalizeCurrency(currency))
    ? Math.round(numericAmount)
    : Math.round(numericAmount * 100);
};

const fromMinorUnitAmount = (amount, currency = "lkr") => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return 0;
  }

  return ZERO_DECIMAL_CURRENCIES.has(normalizeCurrency(currency))
    ? numericAmount
    : numericAmount / 100;
};

const isMongoObjectId = (value = "") => /^[a-f\d]{24}$/i.test(value);

const verifyMyAppointment = async (appointmentId, authHeader) => {
  const response = await fetch(`${getAppointmentServiceUrl()}/appointments/my/${appointmentId}`, {
    headers: {
      Authorization: authHeader
    }
  });

  if (!response.ok) {
    return { valid: false, message: "Appointment not found for this patient" };
  }

  const appointment = await response.json();
  if (!["ACCEPTED", "COMPLETED"].includes(appointment.status)) {
    return { valid: false, message: "Payment is allowed only for accepted/completed appointments" };
  }

  return { valid: true, appointment };
};

const getPaymentIdentityFields = (user = {}) => ({
  patientName: user.name || "",
  patientEmail: (user.email || "").toLowerCase()
});

const ensurePendingPaymentRecord = async ({
  appointmentId,
  patientId,
  patientName,
  patientEmail,
  amount,
  currency,
  method = STRIPE_CHECKOUT_METHOD
}) => {
  let payment = await Payment.findOne({ appointmentId, patientId });

  if (!payment) {
    payment = await Payment.create({
      appointmentId,
      patientId,
      patientName,
      patientEmail,
      amount,
      currency,
      method,
      status: "PENDING"
    });
    return payment;
  }

  payment.amount = amount;
  payment.currency = currency;
  payment.method = method;
  payment.patientName = patientName;
  payment.patientEmail = patientEmail;

  if (payment.status !== "PAID") {
    payment.status = "PENDING";
    payment.failureReason = "";
  }

  await payment.save();
  return payment;
};

const getPaymentFromCheckoutSession = async (session) => {
  const paymentRecordId = session?.metadata?.paymentRecordId;
  if (paymentRecordId && isMongoObjectId(paymentRecordId)) {
    const paymentById = await Payment.findById(paymentRecordId);
    if (paymentById) {
      return paymentById;
    }
  }

  if (session?.id) {
    const paymentBySession = await Payment.findOne({ stripeCheckoutSessionId: session.id });
    if (paymentBySession) {
      return paymentBySession;
    }
  }

  const appointmentId = session?.metadata?.appointmentId;
  const patientId = session?.metadata?.patientId;
  if (appointmentId && patientId) {
    return Payment.findOne({ appointmentId, patientId });
  }

  return null;
};

const syncPaymentWithCheckoutSession = async (session) => {
  const payment = await getPaymentFromCheckoutSession(session);

  if (!payment) {
    return null;
  }

  const sessionCurrency = (session.currency || payment.currency || "lkr").toUpperCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

  payment.method = STRIPE_CHECKOUT_METHOD;
  payment.currency = sessionCurrency;
  payment.stripeCheckoutSessionId = session.id || payment.stripeCheckoutSessionId;
  payment.stripePaymentIntentId = paymentIntentId || payment.stripePaymentIntentId;

  if (Number.isFinite(Number(session.amount_total))) {
    payment.amount = fromMinorUnitAmount(session.amount_total, session.currency || payment.currency);
  }

  if (session.payment_status === "paid") {
    payment.status = "PAID";
    payment.failureReason = "";
    payment.paidAt = payment.paidAt || new Date();
    payment.transactionRef = paymentIntentId || session.id || payment.transactionRef;
  } else if (session.status === "expired") {
    payment.status = "FAILED";
    payment.failureReason = "Stripe Checkout session expired.";
  } else if (session.status === "complete" && session.payment_status !== "paid") {
    payment.status = "FAILED";
    payment.failureReason = "Stripe Checkout completed without a successful payment.";
  } else if (payment.status !== "PAID") {
    payment.status = "PENDING";
  }

  await payment.save();
  return payment;
};

const buildSuccessUrl = () =>
  `${getFrontendUrl()}/patient/appointments?payment=success&session_id={CHECKOUT_SESSION_ID}`;

const buildCancelUrl = (appointmentId) =>
  `${getFrontendUrl()}/patient/appointments?payment=cancelled&appointmentId=${encodeURIComponent(appointmentId)}`;

const createCheckoutSession = async (req, res) => {
  try {
    const stripeConfigurationError = getStripeConfigurationError();
    if (stripeConfigurationError) {
      return res.status(503).json({ message: stripeConfigurationError });
    }

    const { appointmentId, amount } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const verification = await verifyMyAppointment(appointmentId, req.headers.authorization || "");
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    const existingPayment = await Payment.findOne({ appointmentId, patientId: req.user.id });
    if (existingPayment?.status === "PAID") {
      return res.status(400).json({
        message: "This appointment has already been paid",
        payment: existingPayment
      });
    }

    const payAmount = Number(amount ?? verification.appointment.consultationFee ?? 0);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: "A valid positive amount is required" });
    }

    const currency = (process.env.STRIPE_CURRENCY || "LKR").toUpperCase();
    const unitAmount = toMinorUnitAmount(payAmount, currency);
    if (unitAmount <= 0) {
      return res.status(400).json({ message: "Unable to derive a valid Stripe charge amount" });
    }

    const payment = await ensurePendingPaymentRecord({
      appointmentId,
      patientId: req.user.id,
      ...getPaymentIdentityFields(req.user),
      amount: payAmount,
      currency,
      method: STRIPE_CHECKOUT_METHOD
    });

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: buildSuccessUrl(),
      cancel_url: buildCancelUrl(appointmentId),
      customer_email: req.user.email,
      client_reference_id: payment._id.toString(),
      metadata: {
        paymentRecordId: payment._id.toString(),
        appointmentId,
        patientId: req.user.id
      },
      payment_intent_data: {
        metadata: {
          paymentRecordId: payment._id.toString(),
          appointmentId,
          patientId: req.user.id
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: normalizeCurrency(currency),
            unit_amount: unitAmount,
            product_data: {
              name: `Consultation with ${verification.appointment.doctorName || "Doctor"}`,
              description: `Appointment ID: ${appointmentId}`
            }
          }
        }
      ]
    });

    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    return res.status(200).json({
      message: "Stripe Checkout session created successfully",
      sessionId: session.id,
      checkoutUrl: session.url,
      payment
    });
  } catch (error) {
    console.error("Stripe Checkout session creation failed:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });

    return res.status(500).json({
      message: "Server error while creating Stripe Checkout session",
      error: error.message
    });
  }
};

const getCheckoutSessionStatus = async (req, res) => {
  try {
    const stripeConfigurationError = getStripeConfigurationError();
    if (stripeConfigurationError) {
      return res.status(503).json({ message: stripeConfigurationError });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    const sessionPatientId = session?.metadata?.patientId;
    if (sessionPatientId && sessionPatientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const payment = await syncPaymentWithCheckoutSession(session);
    if (payment && payment.patientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      sessionId: session.id,
      checkoutStatus: session.status,
      paymentStatus: session.payment_status,
      payment
    });
  } catch (error) {
    console.error("Stripe Checkout session lookup failed:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });

    return res.status(500).json({
      message: "Server error while fetching Stripe Checkout session",
      error: error.message
    });
  }
};

const handleStripeWebhook = async (req, res) => {
  try {
    const stripeConfigurationError = getStripeConfigurationError();
    if (stripeConfigurationError) {
      return res.status(503).send(stripeConfigurationError);
    }

    const stripeWebhookConfigurationError = getStripeWebhookConfigurationError();
    if (stripeWebhookConfigurationError) {
      return res.status(503).send(stripeWebhookConfigurationError);
    }

    const stripe = getStripeClient();
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, getStripeWebhookSecret());
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    const session = event.data.object;

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await syncPaymentWithCheckoutSession(session);
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const payment = await getPaymentFromCheckoutSession(session);
      if (payment && payment.status !== "PAID") {
        payment.status = "FAILED";
        payment.failureReason = "Stripe reported that the payment failed.";
        await payment.save();
      }
    }

    if (event.type === "checkout.session.expired") {
      const payment = await getPaymentFromCheckoutSession(session);
      if (payment && payment.status !== "PAID") {
        payment.status = "FAILED";
        payment.failureReason = "Stripe Checkout session expired.";
        await payment.save();
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });

    return res.status(500).send("Server error while processing Stripe webhook");
  }
};

const payForAppointment = async (req, res) => {
  try {
    const { appointmentId, amount, method = "MOCK_CARD", simulateFailure = false } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const verification = await verifyMyAppointment(appointmentId, req.headers.authorization || "");
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    const payAmount = Number(amount ?? verification.appointment.consultationFee ?? 0);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: "A valid positive amount is required" });
    }

    let payment = await Payment.findOne({ appointmentId, patientId: req.user.id });
    if (payment?.status === "PAID") {
      return res.status(400).json({
        message: "This appointment has already been paid",
        payment
      });
    }

    const status = simulateFailure ? "FAILED" : "PAID";
    const transactionRef = `TXN-${Date.now()}`;

    if (!payment) {
      payment = await Payment.create({
        appointmentId,
        patientId: req.user.id,
        ...getPaymentIdentityFields(req.user),
        amount: payAmount,
        currency: "LKR",
        method,
        status,
        transactionRef,
        paidAt: status === "PAID" ? new Date() : null,
        failureReason: status === "FAILED" ? "Mock payment failure requested." : ""
      });
    } else {
      payment.amount = payAmount;
      payment.currency = payment.currency || "LKR";
      payment.method = method;
      payment.patientName = req.user.name || payment.patientName;
      payment.patientEmail = (req.user.email || payment.patientEmail || "").toLowerCase();
      payment.status = status;
      payment.transactionRef = transactionRef;
      payment.paidAt = status === "PAID" ? new Date() : payment.paidAt;
      payment.failureReason = status === "FAILED" ? "Mock payment failure requested." : "";
      await payment.save();
    }

    return res.status(200).json({
      message: status === "PAID" ? "Payment completed successfully" : "Payment failed",
      payment
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while processing payment" });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching payments" });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching all payments" });
  }
};

const getPaymentByAppointment = async (req, res) => {
  try {
    const query = { appointmentId: req.params.appointmentId };

    if (req.user.role === "PATIENT") {
      query.patientId = req.user.id;
    }

    const payment = await Payment.findOne(query);

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching payment" });
  }
};

module.exports = {
  createCheckoutSession,
  getCheckoutSessionStatus,
  handleStripeWebhook,
  payForAppointment,
  getMyPayments,
  getAllPayments,
  getPaymentByAppointment
};
