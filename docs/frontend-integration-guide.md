# Frontend Razorpay Integration Guide

This guide explains how to properly integrate Razorpay payments in your frontend application.

## API Response Structure

The backend returns the following structure for payment orders:

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_test_1758015419078",
      "amount": 10000,
      "currency": "INR",
      "receipt": "test_receipt_1758015419078",
      "status": "created",
      "key": "rzp_test_RIDyR9uOrC4iUY"
    },
    "paymentId": "test_payment_1758015419078",
    "key": "rzp_test_RIDyR9uOrC4iUY"
  }
}
```

## Frontend Implementation

### 1. Create Razorpay Order

```javascript
const createRazorpayOrder = async (appointmentId) => {
  try {
    const response = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        appointmentId: appointmentId,
        isTest: true, // Set to false for production
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.data; // Contains order, paymentId, and key
    } else {
      throw new Error(data.message || "Failed to create order");
    }
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};
```

### 2. Initialize Razorpay Payment

```javascript
const initializeRazorpayPayment = async (appointmentId) => {
  try {
    // Step 1: Create order
    const orderData = await createRazorpayOrder(appointmentId);

    // Step 2: Extract key from response
    const razorpayKey = orderData.key || orderData.order.key;

    if (!razorpayKey) {
      throw new Error("Razorpay key not found in response");
    }

    // Step 3: Configure Razorpay options
    const options = {
      key: razorpayKey, // This is the key from the API response
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Synopsis Medical",
      description: "Medical Appointment Payment",
      order_id: orderData.order.id,
      handler: function (response) {
        // Handle successful payment
        console.log("Payment successful:", response);
        verifyPayment(response, orderData.paymentId);
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
        color: "#3399cc",
      },
    };

    // Step 4: Open Razorpay checkout
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Payment initialization failed:", error);
    alert("Payment failed: " + error.message);
  }
};
```

### 3. Verify Payment

```javascript
const verifyPayment = async (razorpayResponse, paymentId) => {
  try {
    const response = await fetch("/api/payments/razorpay/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        paymentId: paymentId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        isTest: true, // Set to false for production
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Payment verified successfully:", data.data);
      // Redirect to success page or show success message
      alert("Payment completed successfully!");
    } else {
      throw new Error(data.message || "Payment verification failed");
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    alert("Payment verification failed: " + error.message);
  }
};
```

### 4. Complete Example

```javascript
// HTML
<button onclick="handlePayment()">Pay Now</button>;

// JavaScript
const handlePayment = async () => {
  try {
    const appointmentId = "your_appointment_id_here";
    await initializeRazorpayPayment(appointmentId);
  } catch (error) {
    console.error("Payment failed:", error);
  }
};

// Make sure Razorpay script is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize when page loads
window.addEventListener("load", async () => {
  const razorpayLoaded = await loadRazorpayScript();
  if (!razorpayLoaded) {
    console.error("Failed to load Razorpay script");
  }
});
```

## Debugging

### Check Razorpay Configuration

You can check the current Razorpay configuration by calling:

```javascript
const checkConfig = async () => {
  try {
    const response = await fetch("/api/payments/razorpay/config");
    const data = await response.json();
    console.log("Razorpay Config:", data.data);
  } catch (error) {
    console.error("Failed to get config:", error);
  }
};
```

### Common Issues

1. **"No key passed" error**: Make sure you're extracting the key from the API response correctly
2. **"Invalid key" error**: Verify the key format starts with `rzp_test_` for test mode
3. **CORS issues**: Ensure your frontend domain is allowed in CORS settings

### Key Extraction Methods

The key can be accessed in multiple ways from the API response:

```javascript
// Method 1: From data.key
const key = orderData.key;

// Method 2: From order.key
const key = orderData.order.key;

// Method 3: Fallback
const key = orderData.key || orderData.order.key || "rzp_test_RIDyR9uOrC4iUY";
```

## Production Setup

For production:

1. Set `isTest: false` in API calls
2. Use real appointment IDs (MongoDB ObjectIds)
3. Replace test keys with production keys
4. Set `DEMO_MODE=false` in backend environment

## Testing

Test the integration with:

```bash
# Test order creation
curl -X POST http://localhost:5000/api/payments/razorpay/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"appointmentId":"test_appointment_123","isTest":true}'

# Test configuration
curl http://localhost:5000/api/payments/razorpay/config
```
