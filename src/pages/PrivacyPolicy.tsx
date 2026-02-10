import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Last updated: 12 Nov 2025
      </p>

      <p className="mb-6">
        We operate the <strong>DF MPD</strong> mobile application (the “App”).
        This Privacy Policy explains how we handle user information.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Information Collection</h2>
        <p className="mb-3">
          We do not collect, store, or share any personal information from users
          through this App. All user accounts are created manually by the
          administrator through our internal system, and login credentials are
          provided directly to the user.
        </p>
        <p className="mb-2">The App does not request or access:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Personal data</li>
          <li>Location data</li>
          <li>Device information</li>
          <li>Contacts or media files</li>
          <li>Payment or financial information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Use of Information</h2>
        <p>
          Since we do not collect any user information, there is no data used,
          processed, or shared for analytics, advertising, or any other purpose.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
        <p>
          All user accounts are created and managed by the Admin Panel. Users
          only use their provided credentials to log in and view daily and sale
          reports related to their dairy account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
        <p>
          The App displays only the data related to your assigned dairy account.
          All information is stored securely in our system and is not shared
          with any external parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Third-Party Access</h2>
        <p>
          The DF MPD App does not use any third-party SDKs, analytics tools, or
          advertising services that collect user data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The latest
          version will always be available within the App or on our Play Store
          page.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
        <p className="mb-2">
          If you have any questions or concerns about this Privacy Policy,
          please contact us at:
        </p>
        <p className="font-medium">
          📧 Email:{" "}
          <a
            href="mailto:shashankchaudhary737@gmail.com"
            className="text-blue-600 hover:underline"
          >
            shashankchaudhary737@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
