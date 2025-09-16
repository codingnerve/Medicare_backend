# Razorpay Test Keys Configuration

This document explains how to use the Razorpay test keys for testing the payment system.

## Environment Variables

The following Razorpay test keys have been added to the `.env` file:

```env
# Razorpay Payment Gateway (Test Keys)
RAZORPAY_KEY_ID="rzp_test_RIDyR9uOrC4iUY"
RAZORPAY_KEY_SECRET="mmmOjdotUB33ZWiaM3zvo3II"
RAZORPAY_WEBHOOK_SECRET="test_webhook_secret_1234567890"

# Demo Mode
DEMO_MODE=true
```

## Demo Mode Features

When `DEMO_MODE=true` or `isTest=true` is passed in the request:

1. **No Real Payment Processing**: All payments are simulated
2. **Mock Data**: Returns mock order and payment data
3. **No Database Writes**: Payment records are not saved to the database
4. **Instant Success**: All payments are marked as successful immediately

## API Endpoints

### Create Razorpay Order

```bash
POST /api/payments/razorpay/order
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "appointmentId": "any_string_for_demo",
  "isTest": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_test_1234567890",
      "amount": 10000,
      "currency": "INR",
      "receipt": "test_receipt_1234567890",
      "status": "created",
      "key": "rzp_test_RIDyR9uOrC4iUY"
    },
    "paymentId": "test_payment_1234567890",
    "key": "rzp_test_RIDyR9uOrC4iUY"
  }
}
```

### Verify Payment

```bash
POST /api/payments/razorpay/verify
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "paymentId": "test_payment_1234567890",
  "isTest": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Test payment verified successfully",
  "data": {
    "_id": "test_payment_1234567890",
    "paymentStatus": "completed",
    "amount": 10000,
    "paymentMethod": "razorpay",
    "gatewayResponse": {
      "status": "success",
      "message": "Test payment verified successfully",
      "timestamp": "2025-09-16T08:30:00.000Z",
      "razorpayOrderId": "test_order_1234567890",
      "razorpayPaymentId": "test_payment_1234567890",
      "razorpaySignature": "test_signature_1234567890"
    }
  }
}
```

## Frontend Integration

For the frontend, you can use these test keys directly in your Razorpay integration:

```javascript
const options = {
  key: "rzp_test_RIDyR9uOrC4iUY", // Test key from environment
  amount: 10000, // Amount in paise
  currency: "INR",
  name: "Synopsis Medical",
  description: "Test Payment",
  order_id: "order_test_1234567890", // From API response
  handler: function (response) {
    // Handle success
    console.log(response);
  },
};
```

## Production Setup

When ready for production:

1. Replace demo keys with real Razorpay keys
2. Set `DEMO_MODE=false` in environment
3. Ensure all `appointmentId` values are valid MongoDB ObjectIds
4. Remove `isTest: true` from API calls

## Security Notes

- These are Razorpay test keys for development/testing only
- Never use test keys in production
- Keep real Razorpay production keys secure and never commit them to version control
- Use environment variables for all sensitive configuration
- Test keys can be used for actual payment testing in Razorpay's test environment
