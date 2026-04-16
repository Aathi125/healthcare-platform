/**
 * Patient Event Publisher
 * Stub - RabbitMQ has been removed.
 * All publish calls are silent no-ops so callers don't break.
 */

const publishPatientEvent = async () => null;
const publishPatientCreated = async () => null;
const publishPatientUpdated = async () => null;
const publishDocumentUploaded = async () => null;
const publishProfileCompleted = async () => null;
const publishPatientDeactivated = async () => null;

module.exports = {
  publishPatientEvent,
  publishPatientCreated,
  publishPatientUpdated,
  publishDocumentUploaded,
  publishProfileCompleted,
  publishPatientDeactivated
};
