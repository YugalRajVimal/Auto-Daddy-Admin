/** Inline HTML for Cashfree Web SDK v3 inside a React Native WebView. */
export const CASHFREE_WEB_SDK_BASE_URL = "https://sdk.cashfree.com";

export function buildCashfreeCheckoutHtml(
  paymentSessionId: string,
  sandbox: boolean
): string {
  const mode = sandbox ? "sandbox" : "production";
  const escaped = paymentSessionId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 24px;
        background: #f8fafc;
      }
      #status {
        text-align: center;
        color: #334155;
        font-size: 16px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <p id="status">Loading secure payment…</p>
    <script>
      (function () {
        var statusEl = document.getElementById("status");
        var sessionId = "${escaped}";
        var mode = "${mode}";
        var attempts = 0;
        var maxAttempts = 40;

        function post(msg) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          }
        }

        function fail(message) {
          statusEl.textContent = message;
          post({ type: "error", message: message });
        }

        function startCheckout() {
          try {
            var CashfreeCtor = window.Cashfree;
            if (typeof CashfreeCtor === "undefined") {
              fail("Cashfree SDK did not load.");
              return;
            }
            statusEl.textContent = "Opening secure payment…";
            var cashfree = CashfreeCtor({ mode: mode });
            cashfree
              .checkout({
                paymentSessionId: sessionId,
                redirectTarget: "_self",
              })
              .then(function (result) {
                if (result && result.error) {
                  fail(result.error.message || "Payment failed.");
                  return;
                }
                if (result && result.paymentDetails) {
                  post({
                    type: "success",
                    orderId: result.paymentDetails.orderId || "",
                  });
                }
              })
              .catch(function (err) {
                fail((err && err.message) || "Could not open checkout.");
              });
          } catch (err) {
            fail((err && err.message) || "Cashfree checkout failed.");
          }
        }

        function waitForSdk() {
          attempts += 1;
          if (typeof window.Cashfree !== "undefined") {
            startCheckout();
            return;
          }
          if (attempts >= maxAttempts) {
            fail("Cashfree SDK timed out. Check your network connection.");
            return;
          }
          setTimeout(waitForSdk, 250);
        }

        function loadSdk() {
          if (typeof window.Cashfree !== "undefined") {
            startCheckout();
            return;
          }
          var existing = document.getElementById("cashfree-sdk");
          if (existing) {
            waitForSdk();
            return;
          }
          var script = document.createElement("script");
          script.id = "cashfree-sdk";
          script.src = "${CASHFREE_WEB_SDK_BASE_URL}/js/v3/cashfree.js";
          script.async = true;
          script.onload = function () {
            waitForSdk();
          };
          script.onerror = function () {
            fail("Could not download Cashfree SDK.");
          };
          document.head.appendChild(script);
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", loadSdk);
        } else {
          loadSdk();
        }
      })();
    </script>
  </body>
</html>`;
}
