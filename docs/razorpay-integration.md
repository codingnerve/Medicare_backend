# Razorpay Integration Documentation

## Overview

This document describes the Razorpay payment integration implemented in the MediCare Pro backend API. The integration includes demo/test API keys and supports all major Razorpay payment methods.

## Features

- ✅ Create Razorpay orders
- ✅ Verify payment signatures
- ✅ Capture payments
- ✅ Process refunds
- ✅ Handle webhooks
- ✅ Demo/test mode support

## API Endpoints

### 1. Create Razorpay Order

**POST** `/api/payments/razorpay/order`

Creates a new Razorpay order for payment processing.

**Request Body:**

```json
{
  "appointmentId": "appointment_id_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "orderId": "order_rzp_test_1234567890",
    "amount": 15000,
    "currency": "INR",
    "receipt": "payment_id_here",
    "razorpayKeyId": "rzp_test_1DP5mmOlF5G5ag",
    "paymentId": "payment_id_here"
  }
}
```

### 2. Verify Razorpay Payment

**POST** `/api/payments/razorpay/verify`

Verifies the payment signature and captures the payment.

**Request Body:**

```json
{
  "paymentId": "payment_id_here",
  "razorpay_order_id": "order_rzp_test_1234567890",
  "razorpay_payment_id": "pay_rzp_test_1234567890",
  "razorpay_signature": "signature_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified and completed successfully",
  "data": {
    "id": "payment_id_here",
    "userId": "user_id_here",
    "appointmentId": "appointment_id_here",
    "amount": 150,
    "currency": "INR",
    "paymentMethod": "upi",
    "paymentStatus": "completed",
    "transactionId": "pay_rzp_test_1234567890",
    "gatewayResponse": {
      "razorpay_order_id": "order_rzp_test_1234567890",
      "razorpay_payment_id": "pay_rzp_test_1234567890",
      "razorpay_signature": "signature_here",
      "verification_status": "success",
      "capture_details": {...}
    }
  }
}
```

### 3. Razorpay Webhook

**POST** `/api/payments/razorpay/webhook`

Handles Razorpay webhook events for payment status updates.

**Supported Events:**

- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `refund.created` - Refund created

## Demo Configuration

### Test API Keys

```env
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisisademokey
```

### Test Card Details

For testing payments, use these test card details:

**Successful Payment:**

- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date
- Name: Any name

**Failed Payment:**

- Card Number: `4000 0000 0000 0002`
- CVV: `123`
- Expiry: Any future date

## Frontend Integration

### 1. Include Razorpay Script

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Create Payment Order

```javascript
// Call your backend to create order
const response = await fetch("/api/payments/razorpay/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    appointmentId: "appointment_id_here",
  }),
});

const orderData = await response.json();
```

### 3. Open Razorpay Checkout

```javascript
const options = {
  key: orderData.data.razorpayKeyId,
  amount: orderData.data.amount,
  currency: orderData.data.currency,
  name: "MediCare Pro",
  description: "Medical Appointment Payment",
  order_id: orderData.data.orderId,
  handler: function (response) {
    // Call verify payment endpoint
    verifyPayment(response);
  },
  prefill: {
    name: "Patient Name",
    email: "patient@example.com",
    contact: "9999999999",
  },
  notes: {
    address: "Medical Center Address",
  },
  theme: {
    color: "#4F46E5",
  },
};

const rzp = new Razorpay(options);
rzp.open();
```

### 4. Verify Payment

```javascript
async function verifyPayment(razorpayResponse) {
  const response = await fetch("/api/payments/razorpay/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      paymentId: orderData.data.paymentId,
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
    }),
  });

  const result = await response.json();
  if (result.success) {
    // Payment successful
    console.log("Payment completed successfully");
  } else {
    // Payment failed
    console.error("Payment verification failed");
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Invalid Signature** - Payment verification fails
2. **Order Not Found** - Razorpay order doesn't exist
3. **Payment Already Processed** - Duplicate payment attempt
4. **Insufficient Funds** - Card has insufficient balance
5. **Network Issues** - Connection problems

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Security Considerations

1. **Signature Verification** - Always verify Razorpay signatures
2. **Webhook Security** - Verify webhook signatures in production
3. **API Key Protection** - Keep secret keys secure
4. **HTTPS Only** - Use HTTPS in production
5. **Input Validation** - Validate all input data

## Testing

### Test Scenarios

1. ✅ Successful payment with valid card
2. ✅ Failed payment with invalid card
3. ✅ Payment verification
4. ✅ Refund processing
5. ✅ Webhook handling

### Test Commands

```bash
# Test order creation
curl -X POST http://localhost:5000/api/payments/razorpay/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"appointmentId": "appointment_id_here"}'

# Test payment verification
curl -X POST http://localhost:5000/api/payments/razorpay/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentId": "payment_id_here",
    "razorpay_order_id": "order_id_here",
    "razorpay_payment_id": "payment_id_here",
    "razorpay_signature": "signature_here"
  }'
```

## Production Setup

1. **Replace Demo Keys** - Use live Razorpay API keys
2. **Enable Webhook Verification** - Implement signature verification
3. **Set Up Monitoring** - Monitor payment success/failure rates
4. **Configure SSL** - Ensure HTTPS is enabled
5. **Test Thoroughly** - Test all payment flows

## Support

For Razorpay-specific issues:

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/

For application-specific issues:

- Check application logs
- Verify database connections
- Test API endpoints

